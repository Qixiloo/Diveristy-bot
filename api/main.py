from fastapi import FastAPI, HTTPException, File, Form, Request
from fastapi.responses import JSONResponse
from typing import Optional,Dict
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from init_chatbot import init_chatbot
from lib.generate_image import generate_image_from_dalle
from lib.expand_prompt import expand_diverse_prompt
from lib.chatbot import chat_message_history_to_dict
from typing import Optional, List
from constants import EMILY_INTRODUCTION
from pymongo import MongoClient 
from pymongo.collection import Collection 
from pymongo.database import Database


# acess mogDB database
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
# PASSWORD = os.getenv('PASSWORD')

# assert PASSWORD is not None
assert OPENAI_API_KEY is not None

ENVIORNMENT = os.getenv('ENVIORNMENT', 'development')
print('ENVIORNMENT',ENVIORNMENT)
connection_string: str = os.environ.get("CONNECTION_STRING")
mongo_client: MongoClient = MongoClient(connection_string)

# add in your database and collection from Atlas
database: Database = mongo_client.get_database("EmilyExperiences")
collection: Collection = database.get_collection("experience_Q&A")

# test={"question_1_3_word":"test, smart, lack of social","question_2_fit":"Yes","question_3_bias":"They are most white male","question_4_feel":"they have more diversity","question_5_feel_with_information":"Yes, I understand more","question_6_diy_question":"Why bias","question_7_diy_image_prompt":"a picture of ASD girl","question_8_is_useful":"Yes","question_9_after_3_word":"diversie, girl, social lifes"}
# collection.insert_one(test)

class ChatIn(BaseModel):
    question: str

load_dotenv()


is_production = ENVIORNMENT == 'production'
model = 'gpt-4' if is_production else 'gpt-3.5-turbo'

origins = [
    "https://diveristy-bot-front.onrender.com" if is_production else
    "http://localhost:4173/"
]

# Global variables to store the current user's conversation,experience and step
conversation = None
userExperience: Optional['UserExperience'] = None 
currentStep: Optional['CurrentStep'] = None
class CurrentStep(BaseModel):
    step: str = "introduction" 

@asynccontextmanager
async def lifespan(app: FastAPI):
    global conversation
    conversation = init_chatbot(OPENAI_API_KEY, model=model)
    print("Chatbot initialized")


    yield

    # Clean up
    conversation = None
    print("Chatbot destroyed")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/chat")
async def get_chat():
    global conversation
    chat_history = chat_message_history_to_dict(conversation.memory.dict())
    return {"response": chat_history}


class UserExperience(BaseModel):
    name: str

@app.post("/add_user")
async def add_user(request: Request):
    global userExperience, currentStep
    try:
        # Parse and validate the incoming JSON data
        user_data = await request.json()
      
        user_model = UserExperience(name=user_data['name'])  # 从请求体中获取 'name'

        # Check if the user already exists based on the name
        existing_user = collection.find_one({"name": user_model.name})
        print('User already exists', existing_user)
        if existing_user:
            # If the user exists, raise an HTTP exception
            raise HTTPException(status_code=400, detail="User Name already exists.")
  

        else:
            # Initialize user experience data and current step (in memory)
            userExperience = user_model  # 使用 UserExperience 类的实例
            currentStep = CurrentStep()  # 使用 CurrentStep 类的实例
            message = "User added and experience initialized successfully."
            # print('userExperience', userExperience)
            # print('currentStep', currentStep)
        
        return JSONResponse(content={"message": message}, status_code=201)

    except Exception as e:
        # 返回错误响应
        return JSONResponse(content={"error": str(e)}, status_code=400)
    
class Message(BaseModel):
    type: str  
    text: str  
    
class UserExperience(BaseModel):
    name: str
    question_1_3_word: Optional[str] = None
    question_2_fit: Optional[str] = None
    question_3_bias: Optional[str] = None
    question_4_feel: Optional[str] = None
    chat_interactions: Optional[List[Dict]] = []
    question_5_after_3_word: Optional[str] = None
    question_6_is_useful: Optional[str] = None

@app.post("/chat")
async def post_chat(question: str = Form(...)):
    global userExperience, currentStep, conversation

    if question.lower().startswith("/introduction"):
        currentStep.step = "three_words"
        response = {
            "text": EMILY_INTRODUCTION,
            "type": "ai" 
        }

    elif currentStep.step == "three_words":
        userExperience.question_1_3_word = question
        currentStep.step = "image_prompt"
        response = {
            "text": "Now, let's explore some pictures in the existing text2img model, type '/image describe an autistic person in real life' to generate some biased images.",
            "type": "ai"
        }

    elif currentStep.step == "image_prompt" and question.lower().startswith("/image"):
        image_desc = question.lower().replace("/image", "").strip()
        if image_desc == "describe an autistic person in real life":
            image_desc = 'describe a lonely autistic young boy'
        image_urls = [generate_image_from_dalle(  image_desc=image_desc, type='image') for _ in range(3)]
        response = {
            "text": "Three images are created. Do they match your perception of an autistic person?",
            "image_urls": image_urls,
            "type": "ai"
        }
        currentStep.step = "fit_question"
    
    elif currentStep.step == "fit_question":
        userExperience.question_2_fit = question
        currentStep.step = "bias_question"
        response = {
            "text": "Do you think the images are biased? If so, how?",
            "type": "ai"
        }

    elif currentStep.step == "bias_question":
        userExperience.question_3_bias = question
        currentStep.step = "diverse_image"
        response = {
            "text": "Thank you. Now type /diverse-image to generate a diverse image.",
            "type": "ai"
        }

    elif currentStep.step == "diverse_image" and question.lower().startswith("/diverse-image"):
        image_desc = question.lower().replace("/diverse-image", "").strip()
        image_url = generate_image_from_dalle(image_desc)
        currentStep.step = "diversity_question"
        response = {
            "text": "Here is the more diverse image you requested. How do you feel about the new images?",
            "image_url": image_url,
            "type": "ai"
        }

    elif currentStep.step == "diversity_question":
        userExperience.question_4_feel = question  
        currentStep.step = "chat"
        response = {
            "text": "You can now chat with me freely. Type your question, and if you want to end the chat, please type /finalize and share with us your feedback.",
            "type": "ai"
        }

    elif currentStep.step == "chat" and question.lower() != "/finalize":
        # Simulate chatbot response
        chat_response = conversation.invoke({"question": question})
        userExperience.chat_interactions.append({"question": question, "response": chat_response['text']})
        print('chat response' , chat_response['text'])
        print('userExperience' , userExperience)
        response = {
            "text": chat_response['text'],
            "type": "ai"
        }
        

    elif currentStep.step == "chat" and question.lower() == "/finalize":
        currentStep.step = "final_three_words"
        response = {
            "text": "Thank you for completing the experience! Before we say goodbye, please type 3 new words about your perception of Autism.",
            "type": "ai"
        }
    
    elif currentStep.step == "final_three_words":
        userExperience.question_5_after_3_word = question
        currentStep.step = "is_useful"
        response = {
            "text": "Do you think the experience is useful?",
            "type": "ai"
        }
    
    elif currentStep.step == "is_useful":
        userExperience.question_6_is_useful = question
        response = {
            "text": "Thank you for your feedback. Your experience data will be saved.",
            "type": "ai"
        }
        print('final User experience data:', userExperience)
        collection.insert_one(userExperience.model_dump())  # 将 UserExperience 实例转换为字典并插入数据库
        userExperience = None  
        currentStep = None  
        response = {
            "text": "Your experience has been recorded. Thank you for participating!",
            "type": "ai"
        }
    else:
        response = {
            "text": "Invalid command or input. Please follow the steps.",
            "type": "ai"
        }

    return {"response": response['text'], "type": response['type'], "image_urls": response.get('image_urls'), "image_url": response.get('image_url')}


@app.get("/")
async def root():
    return {"message": "Hello, World!"}
# if is_production:
#     app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == '__main__':
    import uvicorn
    print(f'Starting server in {ENVIORNMENT} mode.')
    to_run = app if is_production else "main:app"
    uvicorn.run(to_run, host="0.0.0.0", port=8000, log_level="debug", reload= not is_production)

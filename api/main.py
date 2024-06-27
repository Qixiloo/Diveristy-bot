from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from typing import Optional
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
from lib.retriever import get_pdf_retriever, run_document_q_and_a
import random
class ChatIn(BaseModel):
    question: str

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PASSWORD = os.getenv('PASSWORD')

assert PASSWORD is not None
assert OPENAI_API_KEY is not None

ENVIORNMENT = os.getenv('ENVIORNMENT', 'development')

is_production = ENVIORNMENT == 'production'
model = 'gpt-4' if is_production else 'gpt-3.5-turbo'

origins = [
    "https://app-chatmancer.fly.dev/" if is_production else
    "http://localhost:5173/"
]

conversation = None

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

loaded_file = None
@app.get("/context_file")
async def get_context_file():
    global loaded_file
    return {"response": loaded_file}

@app.post("/clear_context_file")
async def reset_context_file():
    global loaded_file
    if loaded_file is not None:
        try:
            os.remove(loaded_file)
        except:
            return {"response": "Error deleting file"}

    loaded_file = None
    return {"response": "Context file has been reset"}


@app.post("/chat")
async def post_chat(question: str = Form(...), file: Optional[UploadFile] = File(None)):
    global loaded_file, conversation
    if question.lower().startswith("/image"):
        image_desc = question.lower().replace("/image", "").strip()
        image_urls = []
        for _ in range(3):
            image_url = generate_image_from_dalle('describe an lonely boy with autism')
            image_urls.append(image_url)
        # image_url = generate_image_from_dalle('describe an lonely boy with autism')

        ai_response = f"Five images are created: {image_urls}"
        print(ai_response)
        conversation.memory.chat_memory.add_user_message(question)
        print(conversation)
        conversation.memory.chat_memory.add_ai_message(ai_response)

        response = {"text": ai_response}
    elif question.lower().startswith("/diverse-image"):
        image_desc = question.lower().replace("/diverse-image", "").strip()
        print('the image_desc is',image_desc)
        expand_prompt = expand_diverse_prompt(image_desc)
        print('now the expand_prompt is',expand_prompt)
        image_url = generate_image_from_dalle(expand_prompt)
        ai_response = f"Here is the more diverse image you requested: {image_url} and the new prompt is: {expand_prompt}"
        conversation.memory.chat_memory.add_user_message(question)
        conversation.memory.chat_memory.add_ai_message(ai_response)
        response = {"text": ai_response}
    elif question.lower().startswith("/introduction"):
        introduction='Do you notice that there are some stereotypes in AI-generated pictures, and what do they show? Are you curious? Let’s start with the </image Describe an autistic person in real life> syntax to find the potential issues current text-to-image model\'s generation, and the /diverse-image <image description> syntax to see our attempt at improvement. Furthermore, we are excited to see your thoughts. If you want to share your story or perceptions about autism, please use the /story <text> syntax to help us improve.'
        response={"text": introduction}
        
    elif question.lower().startswith("/story"):
        link='https://docs.google.com/forms/d/e/1FAIpQLSce-N7nGjUyJO21lttwJzzD5z0V5Lqv1ckAYB1aSYp5DuLi7g/viewform?usp=sf_link'
        response={'text': f"Share your story: {link}"}
    elif question.lower().startswith("/why"):
        whybias='Why do AI-generated images of autism always depict a young white boy? Why are these stereotypes generated?'
        response = conversation.invoke({"question": whybias})
    elif question.lower().startswith("/how"):
        howlike = ['https://www.ambitiousaboutautism.org.uk/about-us/media-centre/blog/what-its-like-to-be-autistic-our-own-words','https://www.youtube.com/watch?v=q3E3Q6tiESA','https://www.youtube.com/watch?v=y4vurv9usYA']
        choseOne=random.choice(howlike)
        response = {"text": f'In their own words: {choseOne}'}
    else:
        response = conversation.invoke({"question": question})

    return {"response": response['text']}



class PasswordIn(BaseModel):
    password: str

@app.post("/verify-password")
async def verify_password(password_in: PasswordIn):
    correct_password = PASSWORD

    if password_in.password == correct_password:
        return {"message": "Password verified successfully."}
    else:
        raise HTTPException(status_code=400, detail=":(")

if is_production:
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == '__main__':
    import uvicorn
    print(f'Starting server in {ENVIORNMENT} mode.')
    to_run = app if is_production else "main:app"
    uvicorn.run(to_run, host="0.0.0.0", port=8000, log_level="debug", reload= not is_production)

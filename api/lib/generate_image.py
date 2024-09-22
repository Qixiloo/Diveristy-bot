from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)


# response = client.images.generate(
#   model="dall-e-3",
#   prompt="a white siamese cat",
#   size="1024x1024",
#   quality="standard",
#   n=1,
# )

# image_url = response.data[0].url
# print
# from openai._client import OpenAI


def generate_image_from_dalle(image_desc: str, type='diverse', temperature = 0.8):
    if type == 'image':
        gpt_prompt = (
            f"Generate a prompt to create an image based on {image_desc}. "
            "Depict a single individual emphasizing autism stereotypes, like loneliness, "
            "being a white boy or man, and social incompetence. The background should be simple and clear, with no text."
        )
    else:
        gpt_prompt = (
            f"Generate a prompt to create an image based on the following description: {image_desc}. "
            "Ensure the image depicts a single individual representing a diverse range of Age, Ethnicity, "
            "and Culture, Gender and Identity, Social Interaction, or Professional and Educational setting. "
            "The atmosphere should be positive, uplifting, and inspiring. The representation should be "
            "realistic, inclusive, and culturally sensitive, avoiding any abstract elements."
        )

   
    try:
        response = client.chat.completions.create(
             model="gpt-4o-mini",
             messages=[
                {"role": "user", "content": gpt_prompt},
            ]
                )   
        message = response.choices[0].message.content
        print('Message:', message)

    except Exception as e:
        print(f"Error generating prompt: {e}")
        return None

   
    try: 
        response = client.images.generate(
        model="dall-e-3",
        prompt=message,
        size="1024x1024",
        quality="standard",
        n=1,
        )

        image_url = response.data[0].url
        return image_url
    except Exception as e:
        print(f"Error generating image: {e}")
        return None


# ima=generate_image_from_dalle(image_desc='an austistic person', type='image')
# print(ima)


def expand_prompt(image_desc: str, temperature = 0.9) -> str:
    """
    This function expand the desc.

    Parameters:
    image_desc (str): The description based on which the image is to be generated.

    Returns:
    new_prompts (str): The new prompts.
    """

    prompt = f"Elaborate diversely on this image description: {image_desc}, you should consider Age Range, Ethnicities and Cultural Backgrounds,Gender and Identity, Social Interactions and Professional and Educational Setting"
    # Assume `openai.Completion.create` is available from the OpenAI import
    response = client.completions.create(
        model="ft:davinci-002:personal:a-better-one:9WnJUbBa",  
        prompt=prompt,
        temperature=temperature,
        max_tokens=150,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=["\n", "."]  # Adjust stopping conditions based on your model's training
    )
    return response.choices[0].text.strip()



# prompt=expand_prompt('an austistic person')
# print(prompt)


# img=generate_image_from_dalle(image_desc='an austistic person', api_key=OPENAI_API_KEY)
# print(img)
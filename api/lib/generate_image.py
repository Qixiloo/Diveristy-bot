from langchain.chains import LLMChain
from langchain_community.utilities.dalle_image_generator import DallEAPIWrapper
from langchain_openai import OpenAI
from langchain.prompts import (
    PromptTemplate,)

# from openai._client import OpenAI


def generate_image_from_dalle(image_desc: str, temperature = 0.8):
    """
    This function generates an image URL based on a given description using DALL-E.

    Parameters:
    image_desc (str): The description based on which the image is to be generated.

    Returns:
    str: The URL of the generated image.

    The function works by creating a prompt template with the given description, and then using a language model (LLMChain with OpenAI) to generate a response based on this prompt. The temperature parameter for the OpenAI model is set to 0.9 to control the randomness of the model's outputs. A higher temperature value results in more random outputs, while a lower value results in more deterministic outputs. In this case, a value of 0.9 is chosen to strike a balance between randomness and determinism, allowing for creative outputs that still closely follow the input prompt.

    The generated response is then passed to the DallEAPIWrapper, which interacts with the DALL-E API to generate an image based on the response. The URL of this generated image is then returned.
    """

    image_prompt = PromptTemplate(
            input_variables=["image_desc"],
            template="Generate a prompt to generate an image based on the following description: {image_desc}, Avoid abstract elements and focus on clarity, paying attention to the appearance.",
    )
    
    # image_prompt = PromptTemplate(
    #         input_variables=["image_desc"],
    #         template="Elaborate diversely on this image description: {image_desc}, you should consider Age, Ethnicities and Cultural,Gender and Identity, Social Interactions and Professional and Educational Setting",
    # )
    image_chain = LLMChain(llm=OpenAI(temperature=temperature), prompt=image_prompt)
    image_response = image_chain.invoke(image_desc)
    print(image_response)   
   
    
    image_url = DallEAPIWrapper(model="dall-e-3").run(image_response['text'])
    return image_url


client = OpenAI(
    api_key = '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'
)

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


# img=generate_image_from_dalle('an austistic person')
# print(img)
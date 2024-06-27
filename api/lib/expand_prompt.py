from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import OpenAI
import re


def extract_clean_descriptions_starting_with_a_or_an(text):
  
    lines = text.split('\n')
    
    # filter the lines contain 'Image created by:'
    filtered_lines = [line for line in lines if "Image created by:" not in line]

    # we only want the lines that start with 'An' or 'A'
    cleaned_descriptions = []
    for line in filtered_lines:
        cleaned_line = re.sub(r'\d+(An|A)', r'\1', line).strip()
        if cleaned_line.startswith('An') or cleaned_line.startswith('A'):
            cleaned_descriptions.append(cleaned_line)

    return cleaned_descriptions



def expand_diverse_prompt(image_desc: str, temperature=0.7) -> list:
    """
    This function uses a fine-tuned model to expand the given image description into a more detailed prompt,
    considering diverse aspects such as Age Range, Ethnicities and Cultural Backgrounds, Gender and Identity,
    Social Interactions, and Professional and Educational Settings.
    
    Parameters:
    image_desc (str): The basic description based on which the image is to be generated.
    temperature (float): The degree of randomness in the response. Higher values generate more varied results.
    
    Returns:
    str: A new, detailed prompt based on the original description.
    """

    # Create a prompt template with detailed consideration factors
    prompt_template = PromptTemplate(
        input_variables=["image_desc"],
        template="Generate a prompt to generate an image based on the following description: {image_desc}"
        # template=("Elaborate diversely on this image description: {image_desc}, consider Age Range, "
        #           "Ethnicities and Cultural Backgrounds, Gender and Identity, Social Interactions, "
        #           "and Professional and Educational Settings.")
    )

    # Create an LLMChain instance using the fine-tuned model and the specified temperature
    llm_chain = LLMChain(
        llm=OpenAI(
            model="ft:davinci-002:personal:a-better-one:9WnJUbBa",
            temperature=temperature,
            max_tokens=50,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            stop=['.']  # 确保在这里添加句号
        ),
        prompt=prompt_template
    )

    # Invoke the LLMChain with the provided image description
    response = llm_chain(image_desc)
    # print('response.text is',response['text'])
    # clean_response=extract_clean_descriptions_starting_with_a_or_an(response['text'])
    # print('clean_response',clean_response)
    return response['text']


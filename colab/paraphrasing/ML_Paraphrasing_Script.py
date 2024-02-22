
# Machine Learning for Finding Paraphrases of Text
# ------------------------------------------------

# Introduction
# ------------
# This script demonstrates how to use machine learning, specifically NLP models, to find paraphrases of given text.
# We will use the Hugging Face Transformers library, which provides a wide range of pre-trained models.

# Installing Necessary Libraries
# ------------------------------
# Uncomment the following line to install the transformers library in Google Colab
# !pip install transformers

# Importing Libraries
# --------------------
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Loading Pre-trained Model and Tokenizer
# ---------------------------------------
model_name = 't5-base'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Paraphrasing Function
# ---------------------
def paraphrase(text, num_return_sequences=3):
    '''
    This function takes a piece of text and generates its paraphrases.
    :param text: str - The text to be paraphrased.
    :param num_return_sequences: int - The number of paraphrase alternatives to generate.
    :return: list - A list of paraphrased sentences.
    '''
    # Preprocess the text
    input_text = f'paraphrase: {text} </s>'
    encoding = tokenizer.encode_plus(input_text, return_tensors='pt')

    # Generate paraphrases
    outputs = model.generate(**encoding, max_length=256, num_return_sequences=num_return_sequences, num_beams=10, temperature=1.5)
    
    # Decode and return the paraphrases
    paraphrases = [tokenizer.decode(output, skip_special_tokens=True, clean_up_tokenization_spaces=True) for output in outputs]
    return paraphrases

# Example Usage
# -------------
original_text = "The quick brown fox jumps over the lazy dog."
paraphrased_texts = paraphrase(original_text)

print("Original Text:")
print(original_text)
print("\nParaphrased Texts:")
for i, paraphrase in enumerate(paraphrased_texts, 1):
    print(f"{i}. {paraphrase}")

# Note:
# This script provides a basic demonstration. For more advanced use-cases and fine-tuning, additional steps are required.

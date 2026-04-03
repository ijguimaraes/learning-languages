import spacy


def load_model(model_name: str = "en_core_web_md") -> spacy.Language:
    return spacy.load(model_name)

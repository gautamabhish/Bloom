import numpy as np
from embedder import embed_text
QUESTION_WEIGHTS = {"q1":1,
                    "q2":1,
                    "q3":1,
                    "q4":1,
                    "q5":1,
                    "q6":1,
                    "q7":1,
                    "q8":1,
                    "q9":1,
                    "q10":1,
                    }
def create_weighted_vector(responses: dict) -> np.ndarray:
    final_vector = None

    for q_id, answer in responses.items():
        if(q_id) == 'q4':
            continue
        weight = QUESTION_WEIGHTS.get(q_id, 1.0)
        emb = embed_text(answer) * weight
        final_vector = emb if final_vector is None else final_vector + emb

    # normalize final vector
    norm = np.linalg.norm(final_vector)
    if norm == 0:
        return final_vector
    return final_vector / norm

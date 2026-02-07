import faiss
import numpy as np

DIM = 384  # MiniLM output size

male_index = faiss.IndexFlatIP(DIM)  # cosine similarity
female_index = faiss.IndexFlatIP(DIM)
male_rollno_vectors = {}  # male_rollno -> vector
female_rollno_vectors = {}
male_id_to_user = {}
female_id_to_user = {}

def add_user_vector(rollno: str, vector: np.ndarray,gender: str):
    vector = vector.astype(np.float32)
    if gender == 'male':
        male_id = male_index.ntotal
        male_index.add(np.array([vector]))
        male_rollno_vectors[rollno] = vector
        male_id_to_user[male_id] = rollno
    elif gender == 'female':
        female_id = female_index.ntotal
        female_index.add(np.array([vector]))
        female_rollno_vectors[rollno] = vector
        female_id_to_user[female_id] = rollno

def search(vector: np.ndarray, k: int,gender: str):
    vector = vector.astype(np.float32)
    results = []
    if gender == 'male':
        D, I = female_index.search(np.array([vector]), k)
        for score, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            results.append((female_id_to_user[idx], float(score)))
        return results
    elif gender == 'female':
        D, I = male_index.search(np.array([vector]), k)
        for score, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            results.append((male_id_to_user[idx], float(score)))
        return results

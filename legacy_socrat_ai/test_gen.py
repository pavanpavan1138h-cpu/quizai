import asyncio
from app.core.generator import QuestionGenerator

async def test():
    print("Initializing Generator...")
    gen = QuestionGenerator()
    print("Generator initialized.")
    # Academic-level text about quantum computing
    text = """
    Quantum computing is a type of computing that uses quantum-mechanical phenomena, such as superposition and entanglement. 
    It leverages quantum bits, or qubits, which can exist in multiple states simultaneously, unlike classical bits which are binary. 
    The principle of superposition allows a quantum computer to process vast amounts of data in parallel, potentially solving problems that are intractable for classical supercomputers. 
    Entanglement, another core quantum property, enables qubits that are separated by large distances to be perfectly correlated, providing a foundation for quantum communication and cryptography. 
    Shor's algorithm and Grover's algorithm are two significant breakthroughs that demonstrate the exponential speedup quantum computers could offer for prime factorization and database searching.
    However, the field faces significant challenges, including decoherence, where external environmental noise causes the loss of quantum information, requiring sophisticated error correction techniques and cryogenic cooling systems.
    """
    print("Generating Academic Questions...")
    try:
        results = await gen.generate_questions(text, 3, "MCQ", "Evaluate")
        print("Results:")
        for r in results:
            print(f"\nID: {r['question_id']} | Level: {r['bloom_level']}")
            print(f"Q: {r['question']}")
            print(f"Opts: {r['options']}")
            print(f"Ans: {r['answer']}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during generation: {e}")

if __name__ == "__main__":
    asyncio.run(test())

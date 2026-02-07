import React, { useState } from "react";
import scroll_bg from "../assets/paper_g.png";
import multi_heart from "../assets/multi_heart.png";
import { generateProfile } from "../api/generate";
const WhisperInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      {/* parchment glow */}
      <div className="absolute inset-0 rounded-2xl bg-[#af323f]/10 blur-lg" />

      <textarea
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        className="
          relative
          w-full
          resize-none
          px-6 py-4
          rounded-2xl
          bg-white/95
          font-lora
          text-sm
          text-[#4a2c2a]
          text-center
          placeholder:italic
          placeholder:text-center
          outline-none
          shadow-lg
          transition-all
          duration-300
          focus:ring-2
          focus:ring-[#af323f]/40
        "
    
      />
    </div>
  );
};

const questions = [
  {
    id: "1",
    question: "What makes you feel most alive these days?",
    placeholder: "Late-night study sessions, music, long walks…",
  },
  {
    id: "2",
    question: "If you had a free evening with no responsibilities, how would you spend it?",
    placeholder: "Quiet night in, friends, creating something…",
  },
  {
    id: "3",
    question: "What small thing can instantly brighten your day?",
    placeholder: "A message, a song, coffee, laughter…",
  },
  {
    id: "4",
    question: "Which three words would your closest friend use to describe you?",
    placeholder: "And why one of them fits you",
  },
  {
    id:"5", 
    question:"Select your gender to help us find the right matches for you",
    placeholder: "Male",
  },
  {
    id: "6",
    question: "What are you secretly hoping college gives you before graduation?",
    placeholder: "Confidence, love, clarity, memories…",
  },
  {
    id: "7",
    question: "What do you value most in relationships?",
    placeholder: "Trust, friendship, loyalty, fun…",
  },
  {
    id: "8",
    question: "How do you usually show care or affection?",
    placeholder: "Words, time, gestures, presence…",
  },
  {
    id: "9",
    question: "What kind of person naturally catches your attention?",
    placeholder: "Calm, curious, expressive, thoughtful…",
  },
  {
    id: "10",
    question: "If someone wrote a short poem about you after meeting once, what would its mood be?",
    placeholder: "Playful, calm, mysterious, dreamy…",
  },
];

const GenerateProfile = () => {
  const [step, setStep] = useState(0);
const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [revealed, setRevealed] = useState(false);
    const [username, setUsername] = useState("CHineseBard");
  const current = questions[step];

  const handleAnswer = (value) => {
  const updated = [...answers];
  updated[step] = value;
  setAnswers(updated);
};

const handleNext = async () => {
  if (!answers[step]) return;

  if (step === questions.length - 1) {
    try {
const payload = {
  answers: answers.map(a => ({ answer: a }))
};


      const data = await generateProfile(payload);
      setUsername(data.username);
      setRevealed(true);
    } catch (err) {
      console.error("Error generating profile:", err);
      alert("Something went wrong. Please try again.");
    }
  } else {
    setStep(step + 1);
  }
};


  return (
    <div className="min-h-screen  bg-gradient-to-b
        from-[#923b42]
        from-[1%]      
                        via-[#f0c9c3]
        to-[#dd908c] flex items-center justify-center px-6">
      {!revealed ? (
        /* QUESTION FLOW */
        <div className="max-w-md w-full text-center transition-all duration-700">
          <p className="text-sm font-lora italic text-[#5b2a2a]/70 mb-4">
            {step + 1} of {questions.length}
          </p>

          <h2 className="text-2xl font-playfair text-[#5b2a2a] mb-6">
            {current.question}
          </h2>

{current.id === "5" ? (
  <div className="flex gap-4 justify-center">
    {["Male", "Female"].map(g => (
      <button
        key={g}
        onClick={() => handleAnswer(g)}
        className={`px-5 py-2 rounded-full ${
          answers[step] === g ? "bg-[#af323f] text-white" : "bg-white"
        }`}
      >
        {g}
      </button>
    ))}
  </div>
) : (
  <WhisperInput
    placeholder={current.placeholder}
    value={answers[step]}
    onChange={(val) => handleAnswer(val)}
  />
)}




          <button
            onClick={handleNext}
            className="
              mt-6
              px-8 py-3
              rounded-full
              bg-[#af323f]/90
              text-white
              font-lora
              shadow-lg
              hover:bg-[#af323f]
              transition
              active:scale-95
            "
          >
            {step === questions.length - 1 ? "Unfold my profile ✨" : "Continue"}
          </button>
        </div>
      ) : (
        /* ROYAL SCROLL REVEAL */
<div
  className="
    paper
    max-w-2xl
    w-full
    mt-6
    mb-6
    min-h-[80vh]
    animate-[unfurl_1.2s_ease-out]
    px-12
    py-8
    relative
  "
  style={{
    backgroundImage: `
      radial-gradient(
        ellipse at center,
        rgba(255,248,237,0.35) 0%,
        rgba(255,248,237,0.45) 55%,
        rgba(255,248,237,0.65) 75%,
        rgba(255,248,237,0.45) 100%
      ),
      linear-gradient(
        to bottom,
        rgba(255,248,237,0.15),
        rgba(243,227,205,0.25)
      ),
      url(${multi_heart})
    `,
    backgroundSize: "cover, contain, 280px",
    backgroundPosition: "center, center, center",
    backgroundRepeat: "no-repeat, repeat, repeat , repeat",
  }}
>

  <h2 className="text-center text-3xl font-playfair italic text-[#5b2a2a] mb-10">
{username}  </h2>

  <div className="space-y-8 font-lora text-sm text-[#4a2c2a]">
    {questions.map((q) => (
      <div key={q.id}>
        <p className="italic opacity-60 mb-1">{q.question}</p>

        <p
          className="italic leading-relaxed"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(140,48,55,0.45) 60%, rgba(140,48,55,0.15) 75%, rgba(140,48,55,0.45) 90%)",
            backgroundPosition: "0 95%",
            backgroundSize: "100% 1px",
            backgroundRepeat: "no-repeat",
            paddingBottom: "2px",
          }}
        >
{answers[Number(q.id) - 1]}
        </p>
      </div>
    ))}
  </div>

  <p className="mt-12 text-center italic text-[#8c3037]">
    ✨ This is how your presence feels ✨
  </p>
</div>


      )}
    </div>
  );
};

export default GenerateProfile;

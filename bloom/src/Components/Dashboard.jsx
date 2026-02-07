import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";

/* ---------- helpers ---------- */

const truncateWords = (text, limit = 80) => {
  const words = text.split(" ");
  return words.length <= limit
    ? text
    : words.slice(0, limit).join(" ") + "…";
};

/* ---------- feed card ---------- */

const FeedCard = ({ item, onExpand }) => {
  const [startX, setStartX] = useState(null);
  const [deltaX, setDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const SWIPE_INTENT = 12; // px
  const SWIPE_ACTION = 90; // px

  const onTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(false);
  };

  const onTouchMove = (e) => {
    if (startX === null) return;

    const moveX = e.touches[0].clientX - startX;

    if (!isSwiping && Math.abs(moveX) > SWIPE_INTENT) {
      setIsSwiping(true); // lock intent as swipe
    }

    if (isSwiping) {
      setDeltaX(moveX);
    }
  };

  const onTouchEnd = () => {
    if (isSwiping) {
      if (deltaX > SWIPE_ACTION) {
        alert("✅ ACCEPT: " + item.profileID);
      } else if (deltaX < -SWIPE_ACTION) {
        alert("❌ REJECT: " + item.profileID);
      }
    } else {
      onExpand(item);
    }

    setDeltaX(0);
    setStartX(null);
    setIsSwiping(false);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="
        paper
        max-w-xl
        w-full
        mt-6
        mb-6
        px-12
        py-8
        relative
        rounded-3xl
        shadow-lg
      "
      style={{
        transform: `translateX(${deltaX}px)`,
        transition: isSwiping ? "none" : "transform 0.25s ease",
        backgroundImage: `
          radial-gradient(
            ellipse at center,
            rgba(255,248,237,0.85) 0%,
            rgba(255,248,237,0.65) 75%,
            rgba(255,248,237,0.35) 100%
          ),
          url(${multi_heart})
        `,
        backgroundSize: "cover, 220px",
        backgroundRepeat: "no-repeat, repeat",
      }}
    >
      <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-6">
        {item.username}
      </h2>

      <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
        {truncateWords(item.text)}
      </p>

      <p className="mt-4 text-center text-xs italic text-[#8c3037]/60">
        Swipe ← / → • Tap to open
      </p>
    </div>
  );
};

/* ---------- dashboard ---------- */

const Dashboard = () => {
  const [expanded, setExpanded] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const feedData = [
    {
      profileID: "p1",
      username: "Someone Nearby",
      text:
        "Late-night walks, soft music, and the comfort of quiet moments. They enjoy being present, observing the world slowly, finding meaning in silence and subtle connections that don’t demand words.",
    },
    {
      profileID: "p2",
      username: "A Familiar Presence",
      text:
        "Calm conversations over warm coffee. Someone who values emotional depth, consistency, and shared routines that feel grounding rather than overwhelming.",
    },
    {
      profileID: "p3",
      username: "A Gentle Spark",
      text:
        "A reassuring presence with thoughtful energy. They listen carefully, speak softly, and leave you feeling slightly lighter after every interaction.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#700912] via-[#c4505a] to-[#dd908c] px-6 py-8 relative">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <img
            key={`h-${i}`}
            src={red_heart}
            className="absolute w-6 opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `floatUp ${12 + Math.random() * 12}s linear infinite`,
            }}
          />
        ))}
        {[...Array(16)].map((_, i) => (
          <img
            key={`b-${i}`}
            src={physics_balloon}
            className="absolute w-16 opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `drift ${18 + Math.random() * 18}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* top bar */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <p className="font-playfair italic text-[#cacaca]">Hello</p>
          <p className="font-lora text-sm text-[#cacaca]/80">
            Your spark is live
          </p>
        </div>

        <button
          onClick={() => setShowNotifications(true)}
          className="p-2 rounded-full bg-white/70"
        >
          <Bell size={18} />
        </button>
      </div>

      {/* feed */}
      <div className="flex flex-col items-center relative z-10">
        {feedData.map((item) => (
          <FeedCard
            key={item.profileID}
            item={item}
            onExpand={setExpanded}
          />
        ))}
      </div>

      {/* expanded card */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setExpanded(null)}
          />
          <div className="relative z-10 max-w-xl w-[92%] paper px-12 py-8 rounded-3xl shadow-2xl">
            <h2 className="text-center text-3xl font-playfair italic text-[#5b2a2a] mb-6">
              {expanded.username}
            </h2>
            <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
              {expanded.text}
            </p>
          </div>
        </div>
      )}

      {/* notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm">
          <div className="mt-6 w-[92%] max-w-md bg-white/90 rounded-3xl px-6 py-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="font-playfair italic">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="font-lora italic text-sm">
              A spark passed near you 🌸
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

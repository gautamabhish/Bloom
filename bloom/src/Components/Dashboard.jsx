//@ts-nocheck
// src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Bell, X, MapPin } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";
import { fetchNotifications } from "../api/notifications";
import { fetchHome } from "../api/fetchHome";
import { updateUserLocation } from "../api/updateLocation";
import { checkNearbyUsers } from "../api/checkNearbyUsers";

/* ---------- helpers ---------- */

const truncateWords = (text, limit = 80) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length <= limit ? text : words.slice(0, limit).join(" ") + "…";
};

/* ---------- FeedCard (stateless) ---------- */

const FeedCard = ({ item, onExpand }) => {
  return (
    <div
      className="
        paper
        max-w-xl
        w-full
        mt-6
        mb-6
        px-8
        py-6
        relative
        rounded-3xl
        shadow-lg
        bg-white/10
        backdrop-blur-sm
      "
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(255,248,237,0.85) 0%, rgba(255,248,237,0.65) 75%), url(${multi_heart})`,
        backgroundSize: "cover, 220px",
        backgroundRepeat: "no-repeat, repeat",
      }}
      onClick={() => onExpand && onExpand(item)}
    >
      <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-4">
        {item.username}
      </h2>

      <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
        {truncateWords(item.poem || item.text || "", 40)}
      </p>

      <p className="mt-4 text-center text-xs italic text-[#8c3037]/60">
        Tap to open profile
      </p>
    </div>
  );
};

/* ---------- Dashboard page ---------- */

const Dashboard = () => {
  const [feedData, setFeedData] = useState([]);
  const [notificationsData, setNotificationsData] = useState({
    signals: [],
    likes: [],
    resonance: [],
  });
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifTab, setNotifTab] = useState("signals"); // 'signals' | 'likes' | 'resonance'
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const nearbyCheckIntervalRef = useRef(null);

  // ---------------- LOCATION TRACKING ----------------

  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
  });

  const [locationPermission, setLocationPermission] = useState("prompt"); // 'granted', 'denied', 'prompt'

  const locationUpdateIntervalRef = useRef(null);

  // Get current position (wrapped in Promise)
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  // Handle successful location fetch
  const handleLocationUpdate = async (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    const locationData = {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
      error: null,
    };

    setUserLocation(locationData);

    console.log("Location updated:", locationData);

    // OPTIONAL: send to backend
    /*
  try {
    await updateUserLocation(latitude, longitude);
  } catch (err) {
    console.error("Backend location update failed:", err);
  }
  */
  };

  // Handle errors
  const handleLocationError = (error) => {
    console.error("Location error:", error);

    let errorMessage = error?.message || "Unknown location error";

    if (error?.code) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user";
          setLocationPermission("denied");
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
    }

    setUserLocation((prev) => ({
      ...prev,
      error: errorMessage,
    }));
  };

  // Start tracking (once + every 60s)
  const startLocationTracking = async () => {
    try {
      console.log("Starting location tracking...");

      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported");
      }

      // First fetch on load
      const position = await getCurrentPosition();
      setLocationPermission("granted");
      await handleLocationUpdate(position);

      // Every 60 seconds
      locationUpdateIntervalRef.current = setInterval(async () => {
        try {
          const pos = await getCurrentPosition();
          await handleLocationUpdate(pos);
        } catch (err) {
          handleLocationError(err);
        }
      }, 60000);
    } catch (err) {
      handleLocationError(err);
    }
  };

  // Stop tracking
  const stopLocationTracking = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  };

  // Start on mount, cleanup on unmount
  useEffect(() => {
    startLocationTracking();

    // 🔁 every 30s ask backend to scan surroundings
    nearbyCheckIntervalRef.current = setInterval(async () => {
      try {
        console.log("Checking nearby users...");
        await checkNearbyUsers();
      } catch (err) {
        console.error("Nearby check failed:", err);
      }
    }, 30000);

    return () => {
      stopLocationTracking();

      if (nearbyCheckIntervalRef.current) {
        clearInterval(nearbyCheckIntervalRef.current);
        nearbyCheckIntervalRef.current = null;
      }
    };
  }, []);

  /*-------------End location tracking state & handlers -------------*/

  /* load home feed on mount */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingFeed(true);
        const res = await fetchHome();
        // res expected as ApiResponse: possibly { status, data, message } or similar
        // We assume fetchHome returns response.data (raw). adapt if structure differs
        const items = res?.data?.items || res?.items || res?.data || [];
        if (mounted) setFeedData(items);
      } catch (err) {
        console.error("fetchHome error:", err);
      } finally {
        setLoadingFeed(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  /* open notifications panel -> fetch categorized notifications */
  const openNotifications = async () => {
    try {
      setLoadingNotif(true);
      setNotifPanelOpen(true);
      const res = await fetchNotifications();
      // server returns: { data: { signals, likes, resonance }, ... } depending on ApiResponse wrapper
      const payload = res?.data || res; // adapt to shape
      const signals = payload?.signals || [];
      const likes = payload?.likes || [];
      const resonance = payload?.resonance || [];
      setNotificationsData({ signals, likes, resonance });
      setNotifTab("signals");
    } catch (err) {
      console.error("fetchNotifications error:", err);
    } finally {
      setLoadingNotif(false);
    }
  };

  /* open a profile from notification item (payload carries userId, username, poem, avatarUrl) */
  const openFromNotification = (item) => {
    // item may contain username/poem — prefer it; else fallback to feedData lookup
    if (!item) return;
    if (item.userId && !item.poem) {
      // try to find in feedData
      const found = feedData.find(
        (f) => f.id === item.userId || f.username === item.username,
      );
      if (found) {
        setExpandedProfile(found);
        setNotifPanelOpen(false);
        return;
      }
    }
    // otherwise just open from notification payload
    setExpandedProfile({
      id: item.userId || item.id,
      username: item.username,
      poem: item.poem,
      avatarUrl: item.avatarUrl,
    });
    setNotifPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#700912] via-[#c4505a] to-[#dd908c] px-6 py-8 relative">
      {/* ambient hearts & balloons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {[...Array(150)].map((_, i) => (
          <img
            key={`h-${i}`}
            src={red_heart}
            className="absolute w-6 opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `floatUp ${12 + Math.random() * 12}s linear infinite`,
            }}
          />
        ))}{" "}
        {[...Array(76)].map((_, i) => (
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
      <div className="flex justify-between items-center mb-6 relative z-10 px-2">
        <div>
          <p className="font-playfair italic text-[#fafafa]">Hello</p>
          <p className="font-lora text-sm text-[#fafafa]/80">
            Your spark is live
          </p>
        </div>

        <button
          onClick={openNotifications}
          className="p-2 rounded-full bg-white/80 shadow"
          aria-label="Open Signals"
        >
          <Bell size={18} className="text-[#5b2a2a]" />
        </button>
      </div>

      {/* feed list */}
      <div className="flex flex-col items-center relative z-10">
        {loadingFeed ? (
          <div className="py-8">Loading feed…</div>
        ) : feedData.length === 0 ? (
          <div className="py-8 text-sm">No profiles yet.</div>
        ) : (
          feedData.map((item) => (
            <FeedCard
              key={item.id || item.username}
              item={item}
              onExpand={setExpandedProfile}
            />
          ))
        )}
      </div>

      {/* profile modal (expanded) */}
      {expandedProfile && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center px-6 py-12">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setExpandedProfile(null)}
          />
          <div
            className="relative z-10 max-w-lg w-full bg-[#fff6e9] rounded-3xl px-8 py-6 overflow-auto"
            style={{ maxHeight: "85vh" }}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-playfair italic text-[#5b2a2a]">
                {expandedProfile.username}
              </h2>
              <button onClick={() => setExpandedProfile(null)} className="p-2">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 font-lora text-sm text-[#4a2c2a] whitespace-pre-wrap leading-relaxed">
              {expandedProfile.poem ||
                expandedProfile.text ||
                "No profile text available."}
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 py-3 rounded-xl bg-[#f3dede] text-[#8c3037]">
                Not now
              </button>
              <button className="flex-1 py-3 rounded-xl bg-[#af323f] text-white">
                Send spark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* notifications panel (tabbed) */}
      {notifPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm px-4 pt-8 pb-6">
          <div className="w-full max-w-md bg-white/95 rounded-3xl px-4 py-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-2 rounded-full ${notifTab === "signals" ? "bg-[#f9e8e8]" : "bg-white"}`}
                  onClick={() => setNotifTab("signals")}
                >
                  Signals
                </button>
                <button
                  className={`px-3 py-2 rounded-full ${notifTab === "likes" ? "bg-[#f9e8e8]" : "bg-white"}`}
                  onClick={() => setNotifTab("likes")}
                >
                  Sparks
                </button>
                <button
                  className={`px-3 py-2 rounded-full ${notifTab === "resonance" ? "bg-[#f9e8e8]" : "bg-white"}`}
                  onClick={() => setNotifTab("resonance")}
                >
                  Blooms
                </button>
              </div>
              <button onClick={() => setNotifPanelOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="min-h-[120px] max-h-[60vh] overflow-auto space-y-3">
              {loadingNotif ? (
                <div>Loading…</div>
              ) : notifTab === "signals" ? (
                notificationsData.signals.length ? (
                  notificationsData.signals.map((s, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left px-3 py-3 rounded-xl bg-[#fff4f4]"
                      onClick={() => openFromNotification(s)}
                    >
                      <div className="font-playfair italic">
                        {s.username || "Someone nearby"}
                      </div>
                      <div className="text-xs font-lora mt-1 text-[#5b2a2a]/80">
                        {s.hint || "Nearby — check location"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-center py-6">
                    No signals nearby right now.
                  </div>
                )
              ) : notifTab === "likes" ? (
                notificationsData.likes.length ? (
                  notificationsData.likes.map((l) => (
                    <button
                      key={l.userId}
                      className="w-full text-left px-3 py-3 rounded-xl bg-[#fff4f4]"
                      onClick={() => openFromNotification(l)}
                    >
                      <div className="font-playfair italic">{l.username}</div>
                      <div className="text-xs font-lora mt-1 text-[#5b2a2a]/80">
                        Sent you a spark
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-center py-6">
                    No pending Sparks.
                  </div>
                )
              ) : notificationsData.resonance.length ? (
                notificationsData.resonance.map((r) => (
                  <button
                    key={r.userId}
                    className="w-full text-left px-3 py-3 rounded-xl bg-[#fffaf0]"
                    onClick={() => openFromNotification(r)}
                  >
                    <div className="font-playfair italic">{r.username}</div>
                    <div className="text-xs font-lora mt-1 text-[#5b2a2a]/80">
                      It's a Bloom — reveal
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-center py-6">No Blooms yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Coins,
  CheckCircle,
  FlaskConical,
  BadgeCheck,
  Crown,
  Package,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";
import Navbar from "../components/Navbar";

const rewardIconByName = {
  "Focus Potion": FlaskConical,
  "Warrior Badge": BadgeCheck,
  "Golden Crown": Crown,
  "Epic Chest": Package,
};

function RewardIcon({ name, size = 32 }) {
  const Icon = rewardIconByName[name] || Package;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function Rewards() {
  const [rewards, setRewards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [gold, setGold] = useState(0);

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const loadRewards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(apiUrl("/api/rewards"), {
        headers: authHeaders(token),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load rewards."
        );
      }

      setRewards(data.rewards || []);
      setGold(data.gold || 0);

      const inventoryResponse = await fetch(
        apiUrl("/api/rewards/inventory"),
        {
          headers: authHeaders(token),
        }
      );

      const inventoryData =
        await inventoryResponse.json();

      if (inventoryResponse.ok) {
        setInventory(inventoryData.inventory || []);
      }
    } catch (err) {
      console.error("Rewards loading error:", err);

      setError(
        err.message || "Unable to load rewards."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    loadRewards();
  }, [token]);

  const buyReward = async (rewardId) => {
    try {
      setBuying(rewardId);
      setMessage("");
      setError("");

      const response = await fetch(
        apiUrl(`/api/rewards/${rewardId}/buy`),
        {
          method: "POST",
          headers: authHeaders(token, {
            "Content-Type": "application/json",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Purchase failed."
        );
      }

      setGold(data.gold);

      setMessage(
        data.message || "Reward purchased successfully!"
      );

      await loadRewards();
    } catch (err) {
      console.error("Purchase error:", err);

      setError(
        err.message || "Unable to purchase reward."
      );
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <Sparkles size={32} />
        <p>Loading rewards...</p>
      </div>
    );
  }

  if (error && !rewards.length) {
    return (
      <div className="page-error" role="alert">
        <h2>Rewards Loading Failed</h2>
        <p>{error}</p>

        <Link to="/login" className="primary-button">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="rewards-page">

      <Navbar />

      {/* MAIN */}

      <main className="rewards-container">

        <div className="rewards-header">

          <div>

            <Link
              to="/dashboard"
              className="back-link"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <h1>Reward Shop</h1>

            <p>
              Spend your hard-earned Gold on
              virtual rewards.
            </p>

          </div>

          <div className="gold-wallet">

            <Coins size={22} />

            <div>
              <span>YOUR GOLD</span>
              <strong>{gold}</strong>
            </div>

          </div>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="success-message" role="status" aria-live="polite">
            <CheckCircle size={18} aria-hidden="true" />
            {message}
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {/* REWARDS */}

        <section className="reward-section">

          <div className="section-title">

            <div>
              <h2>Available Rewards</h2>

              <p>
                Choose a reward and spend your Gold.
              </p>
            </div>

            <ShoppingBag size={28} />

          </div>

          <div className="rewards-grid">

            {rewards.map((reward) => {

              const canBuy =
                gold >= reward.cost;

              const isBuying =
                buying === reward.id;

              return (
                <div
                  className="reward-shop-card"
                  key={reward.id}
                >

                  <div className="reward-icon">
                    <RewardIcon name={reward.name} />
                  </div>

                  <div className="reward-content">

                    <h3>{reward.name}</h3>

                    <p>
                      {reward.description}
                    </p>

                    <div className="reward-bottom">

                      <div className="reward-cost">
                        <Coins size={17} />
                        <strong>
                          {reward.cost}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="primary-button reward-buy-button"
                        onClick={() =>
                          buyReward(reward.id)
                        }
                        disabled={
                          !canBuy || isBuying
                        }
                        aria-busy={isBuying}
                      >
                        {isBuying
                          ? "Buying..."
                          : canBuy
                          ? "Purchase"
                          : "Not Enough Gold"}
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* INVENTORY */}

        <section className="inventory-section">

          <div className="section-title">

            <div>
              <h2>My Inventory</h2>

              <p>
                Rewards you have purchased.
              </p>
            </div>

          </div>

          {inventory.length === 0 ? (
            <div className="empty-inventory">

              <ShoppingBag size={38} />

              <h3>Your inventory is empty</h3>

              <p>
                Complete quests, earn Gold and
                purchase your first reward.
              </p>

            </div>
          ) : (
            <div className="inventory-grid">

              {inventory.map((item) => (

                <div
                  className="inventory-card"
                  key={item.id}
                >

                  <div className="inventory-icon">
                    <RewardIcon name={item.name} size={24} />
                  </div>

                  <div>
                    <h3>{item.name}</h3>

                    <p>
                      {item.description}
                    </p>

                    <span>
                      Purchased
                    </span>
                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Rewards;
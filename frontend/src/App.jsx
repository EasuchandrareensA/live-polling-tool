import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   LOGIN PAGE
========================= */

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const login = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);

      navigate("/");
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the backend");
    }
  };

  return (
    <div className="app">
      <div className="poll-container">
        <h1 className="title">Login</h1>

        <p className="subtitle">
          Login to create and manage your polls.
        </p>

        <form onSubmit={login}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="create-button">
            Login
          </button>
        </form>

        <button
          onClick={() => navigate("/register")}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #6366f1",
            borderRadius: "10px",
            background: "white",
            color: "#6366f1",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Create an Account
        </button>

        {message && (
          <p style={{ marginTop: "20px", textAlign: "center" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================
   REGISTER PAGE
========================= */

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const register = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Registration failed");
        return;
      }

      setMessage("Registration successful!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the backend");
    }
  };

  return (
    <div className="app">
      <div className="poll-container">
        <h1 className="title">Create Account</h1>

        <p className="subtitle">
          Register to create and manage polls.
        </p>

        <form onSubmit={register}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="create-button">
            Register
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Back to Login
        </button>

        {message && (
          <p style={{ marginTop: "20px", textAlign: "center" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================
   CREATE POLL PAGE
========================= */

function HomePage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [message, setMessage] = useState("");
  const [createdPollId, setCreatedPollId] = useState("");
  const [myPolls, setMyPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  /* =========================
     LOAD MY POLLS
  ========================= */

  const loadMyPolls = async () => {
    if (!token) {
      setLoadingPolls(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/my-polls`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to load your polls");
        return;
      }

      setMyPolls(data);
    } catch (error) {
      console.error(error);
      setMessage("Could not load your polls");
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    loadMyPolls();
  }, [token]);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");
  };

  /* =========================
     CREATE POLL
  ========================= */

  const createPoll = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    const validOptions = options
      .map((option) => option.trim())
      .filter((option) => option !== "");

    if (question.trim() === "") {
      setMessage("Please enter a poll question.");
      return;
    }

    if (validOptions.length < 2) {
      setMessage("Please provide at least 2 options.");
      return;
    }

    const pollData = {
      question: question.trim(),
      options: validOptions.map((option, index) => ({
        id: String(index + 1),
        text: option,
        votes: 0,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/api/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pollData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to create poll");
        return;
      }

      const newPollId = data.id;

      setCreatedPollId(newPollId);
      setMessage("Poll created successfully!");

      setQuestion("");
      setOptions(["", ""]);

      /* Refresh My Polls */
      await loadMyPolls();
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the backend");
    }
  };

  /* =========================
     COPY LINK
  ========================= */

  const copyPollLink = async (pollId) => {
    const pollLink = `${window.location.origin}/poll/${pollId}`;

    try {
      await navigator.clipboard.writeText(pollLink);
      setMessage("Poll link copied!");
    } catch (error) {
      console.error(error);
      setMessage("Could not copy poll link");
    }
  };

  /* =========================
     DELETE POLL
  ========================= */

  const deletePoll = async (pollId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this poll?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/polls/${pollId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to delete poll");
        return;
      }

      setMessage("Poll deleted successfully!");

      if (createdPollId === pollId) {
        setCreatedPollId("");
      }

      await loadMyPolls();
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the backend");
    }
  };

  if (!token) {
    return (
      <div className="app">
        <div className="poll-container">
          <h1 className="title">Live Polling Tool</h1>

          <p className="subtitle">
            Login to create and manage your polls.
          </p>

          <button
            className="create-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            onClick={() => navigate("/register")}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              border: "1px solid #6366f1",
              borderRadius: "10px",
              background: "white",
              color: "#6366f1",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="poll-container">

        {/* USER HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <span>
            Logged in as <strong>{username}</strong>
          </span>

          <button
            onClick={logout}
            style={{
              padding: "8px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        {/* TITLE */}

        <h1 className="title">Live Polling Tool</h1>

        <p className="subtitle">
          Create a poll and see results update live.
        </p>

        {/* CREATE NEW POLL */}

        <div
          style={{
            marginBottom: "20px",
            padding: "15px 18px",
            background: "#f8fafc",
            borderLeft: "4px solid #6366f1",
            borderRadius: "8px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "5px",
            }}
          >
            Create a new poll
          </h2>

          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Ask a question and let your audience vote in real time.
          </p>
        </div>

        {/* CREATE POLL FORM */}

        <form onSubmit={createPoll}>
          <div className="form-group">
            <label>Poll Question</label>

            <input
              type="text"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Options</label>

            {options.map((option, index) => (
              <div className="option-row" key={index}>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(event) =>
                    updateOption(index, event.target.value)
                  }
                  required
                />
              </div>
            ))}

            <button
              type="button"
              className="add-option"
              onClick={addOption}
            >
              + Add Option
            </button>
          </div>

          <button type="submit" className="create-button">
            Create Poll
          </button>
        </form>

        {/* MESSAGE */}

        {message && (
          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        {/* CREATED POLL */}

        {createdPollId && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f3f4f6",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              Share this poll:
            </p>

            <p
              style={{
                wordBreak: "break-all",
                marginBottom: "15px",
              }}
            >
              {window.location.origin}/poll/{createdPollId}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                onClick={() => copyPollLink(createdPollId)}
                className="create-button"
              >
                Copy Link
              </button>

              <button
                onClick={() =>
                  navigate(`/poll/${createdPollId}`)
                }
                className="create-button"
              >
                Open Poll
              </button>
            </div>

            <button
              onClick={() => deletePoll(createdPollId)}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "13px",
                border: "1px solid #dc2626",
                borderRadius: "10px",
                background: "#fff",
                color: "#dc2626",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🗑 Delete Poll
            </button>
          </div>
        )}

        {/* =========================
            MY POLLS
        ========================= */}

        <div
          style={{
            marginTop: "35px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              marginBottom: "8px",
            }}
          >
            My Polls
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "20px",
            }}
          >
            Manage the polls you have created.
          </p>

          {loadingPolls ? (
            <p style={{ textAlign: "center" }}>
              Loading your polls...
            </p>
          ) : myPolls.length === 0 ? (
            <div
              style={{
                padding: "25px",
                textAlign: "center",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                color: "#6b7280",
              }}
            >
              You haven't created any polls yet.
            </div>
          ) : (
            <div>
              {myPolls.map((poll) => {
                const totalVotes = poll.options.reduce(
                  (total, option) => total + option.votes,
                  0
                );

                return (
                  <div
                    key={poll.id}
                    style={{
                      padding: "20px",
                      marginBottom: "15px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow:
                        "0 3px 10px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      {poll.question}
                    </h3>

                    <p
                      style={{
                        color: "#6b7280",
                        marginBottom: "15px",
                      }}
                    >
                      {totalVotes}{" "}
                      {totalVotes === 1 ? "vote" : "votes"}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/poll/${poll.id}`)
                        }
                        className="create-button"
                      >
                        Open Poll
                      </button>

                      <button
                        onClick={() =>
                          copyPollLink(poll.id)
                        }
                        className="create-button"
                      >
                        Copy Link
                      </button>
                    </div>

                    <button
                      onClick={() => deletePoll(poll.id)}
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        padding: "12px",
                        border:
                          "1px solid #dc2626",
                        borderRadius: "10px",
                        background: "white",
                        color: "#dc2626",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      🗑 Delete Poll
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   SHARED POLL PAGE
========================= */

function PollPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [message, setMessage] = useState("Loading poll...");

  const loadPoll = async () => {
    try {
      const response = await fetch(`${API_URL}/api/polls/${id}`);

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Poll not found");
        return;
      }

      setPoll(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the backend");
    }
  };

  useEffect(() => {
    loadPoll();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const eventSource = new EventSource(
      `${API_URL}/api/polls/${id}/live`
    );

    eventSource.onmessage = async (event) => {
      console.log("Live update:", event.data);

      await loadPoll();
    };

    eventSource.onerror = () => {
      console.log("Live connection interrupted");
    };

    return () => {
      eventSource.close();
    };
  }, [id]);

  const vote = async (optionId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/polls/${id}/vote/${optionId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Vote failed");
        return;
      }

      setMessage("Vote recorded!");
    } catch (error) {
      console.error(error);
      setMessage("Could not submit vote");
    }
  };

  if (!poll) {
    return (
      <div className="app">
        <div className="poll-container">
          <h1 className="title">Shared Poll</h1>

          <p style={{ textAlign: "center" }}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  const totalVotes = poll.options.reduce(
    (total, option) => total + option.votes,
    0
  );

  return (
    <div className="app">
      <div className="poll-container">
        {/* POLL QUESTION */}

        <h1 className="title">{poll.question}</h1>

        <p className="subtitle">
          Vote below and watch the results update live.
        </p>

        {/* TOTAL VOTES */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
            padding: "14px",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Total Votes
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#4f46e5",
            }}
          >
            {totalVotes}
          </div>
        </div>

        {/* POLL OPTIONS */}

        {poll.options.map((option) => {
          const percentage =
            totalVotes === 0
              ? 0
              : Math.round(
                  (option.votes / totalVotes) * 100
                );

          return (
            <div
              key={option.id}
              style={{
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() => vote(option.id)}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontSize: "16px",
                  textAlign: "left",
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                  boxShadow:
                    "0 2px 6px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>{option.text}</span>

                  <span>
                    {option.votes}{" "}
                    {option.votes === 1
                      ? "vote"
                      : "votes"}{" "}
                    ({percentage}%)
                  </span>
                </div>
              </button>

              {/* PROGRESS BAR */}

              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  marginTop: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: "#6366f1",
                    borderRadius: "10px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* MESSAGE */}

        {message && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        {/* LIVE STATUS */}

        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            textAlign: "center",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            color: "#16a34a",
            fontWeight: "bold",
          }}
        >
          🔴 Live results enabled
        </div>

        {/* BACK TO HOME */}

        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "13px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "white",
            color: "#374151",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

/* =========================
   ROUTER
========================= */

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
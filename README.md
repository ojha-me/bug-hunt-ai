# BugHunt AI   
**Learn to Code by Fixing Bugs — In Real-Time Conversations**

> 💡 Traditional coding tutorials are passive. You read. You watch. Then you struggle. You get bored. You get the faulty feeling of acheivement but you've hardly learnt anything.  
> **BugHunt AI flips the script.** Learn by doing — inside a live conversation with an AI tutor who gives you broken code and challenges you to fix it.

[![Tech Stack](https://img.shields.io/badge/Tech-Django%20%2B%20React%20%2B%20Gemini-blue)](tech)
[![Status](https://img.shields.io/badge/Status-Beta-green)](status)

---

## The Big Idea

Most learners forget code because they don’t *use* it deeply enough.

**BugHunt AI makes learning active, engaging, and memorable** by turning coding education into a **bug-hunting game** powered by AI:

1. Ask a question: *"What’s a closure in JavaScript?"*
2. Get a clear explanation — and a live code editor with working (or broken!) examples.
3. Tweak, run, and explore right in your browser.
4. The AI throws you a challenge: *"This function should return 6, but it returns NaN. Find the bug!"*
5. Fix it. Submit. Get instant feedback.
6. Level up.

🧠 It’s not just about answers — it’s about **thinking like a developer**.

---

## ✨ Key Features

### 💬 Conversational Learning
Chat with a Gemini-powered AI tutor that adapts to your level and guides you through concepts with real code.

### 🧩 Interactive Code Snippets
Every code example appears in a **fully-featured Monaco editor** (same engine as VS Code) — editable, syntax-highlighted, and ready to run.

### ⚡ In-Browser Execution
Run code safely in a sandboxed Docker container — no setup, no risk. See output instantly without leaving the chat.

### 🐛 AI-Generated Challenges
The AI doesn’t just teach — it **tests your understanding** with unique, context-aware coding puzzles containing subtle bugs.

### 🔍 Real-Time Code Review
Submit your fix and get:
- ✅ Confirmation if correct
- 🛠 Hints if you’re stuck
- 📚 Explanations of what went wrong and why

### 🔄 Feedback Loop Built-In
Mistakes are part of learning. Every failed attempt becomes a teaching moment — all inside the same conversation.

---

## 🛠️ How It Works

1. **Start a Conversation**  
   Ask anything: *"Explain async/await in Python"* or *"Show me a React component with state."*

2. **Get Live Code**  
   The AI responds with explanation + an embedded code editor. Run it. Break it. Fix it.

3. **Receive a Challenge**  
   “Here’s a function that’s supposed to reverse a string — but it doesn’t work. Can you find the bug?”

4. **Hunt the Bug**  
   Edit the code in the editor. Try different fixes. Run it repeatedly.

5. **Submit & Learn**  
   Click “Submit Solution.” The AI runs it, analyzes your fix, and gives personalized feedback.

6. **Repeat & Master**  
   Build muscle memory through practice, not passive watching.

---

## 🔧 Tech Stack

| Layer       | Technology |
|------------|-----------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Monaco Editor |
| **Backend**  | Python, Django, Django Ninja (API), Django Channels (WebSockets) |
| **AI Engine** | Google Gemini API (for explanations, challenges, and code review) |
| **Code Execution** | Docker containers (sandboxed, secure, per-session isolation) |
| **Auth**     | JWT authentication |
| **Tooling**  | `uv` (Python package manager), `yarn` (frontend) |

All code execution happens in isolated, resource-limited containers — safe even if users write infinite loops or malicious code.

---

## 🚀 Future Roadmap

- [ ] Support multiple languages: JavaScript,TypeScript, Python
- [ ] Save progress & track skills over time
- [ ] Create custom challenges (teachers/coaches)
- [ ] Add multiplayer debugging races
- [ ] Export snippets to GitHub Gist

---

## 🎯 Ready to Hunt Bugs?

> “The best way to learn code is to break it, then fix it.”  
> — BugHunt AI

👉 Start the conversation. Break something. Learn deeply.

🚀 **Launch the app and begin your first bug hunt today.**

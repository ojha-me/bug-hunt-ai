# BugHunt AI   
**Master Programming Through Interactive Bug Hunting & Structured Learning Paths**

> Traditional coding tutorials are passive. You read. You watch. Then you struggle. You get bored. You get the fake sense of achievement but you've hardly learnt anything.  
> **BugHunt AI flips the script.** Learn by doing — either through structured learning journeys or instant bug-hunting challenges with an AI tutor who gives you broken code and guides you to fix it.

[![Tech Stack](https://img.shields.io/badge/Tech-Django%20%2B%20React%20%2B%20Gemini-blue)](tech)
[![Status](https://img.shields.io/badge/Status-Beta-green)](status)

---

## The Big Idea

Most learners forget code because they don't *use* it deeply enough.

**BugHunt AI makes learning active, engaging, and memorable** through two powerful learning modes:

### **General Chat Mode** (Instant Bug Hunting)
Jump straight into coding challenges and get immediate help:
1. Ask any question: *"What's a closure in JavaScript?"*
2. Get explanations with live, editable code examples
3. Receive instant challenges: *"This function should return 6, but it returns NaN. Find the bug!"*
4. Fix it, submit, get feedback, and level up
5. Learn through exploration and immediate problem-solving

### **Learning Paths Mode** (Structured Learning Path)
Follow curated programming courses with progress tracking:
1. Tell the AI what you want to learn: *"How to debug in Python?"*
2. The AI generates a structured lesson plan with clear objectives
3. Progress through structured lessons with clear objectives
4. Learn concepts through interactive explanations and examples
5. The AI keeps track of what you've studied and what you need to study next
6. After you've covered all necessary points for a subtopic, it will congratulate you and move you to the next subtopic
7. Track your progress and build skills systematically
8. Master programming step-by-step with AI guidance


It's not just about answers — it's about **thinking like a developer** through both structured learning and hands-on practice.

---

## Key Features

### **Structured Learning Paths**
- **Curated Topics**: JavaScript Fundamentals, Python Basics, React Development, and more
- **Progress Tracking**: Visual progress bars and completion statistics
- **Learning Objectives**: Clear goals for each lesson and subtopic
- **Flexible Navigation**: Skip, revisit, or advance through topics at your own pace
- **Prerequisites System**: Logical learning progression with topic dependencies

### **Conversational Learning**
Chat with a Gemini-powered AI tutor that adapts to your level and guides you through concepts with real code.

### **Interactive Code Snippets**
Every code example appears in a **fully-featured Monaco editor** (same engine as VS Code) — editable, syntax-highlighted, and ready to run.

### **In-Browser Execution**
Run code safely in a sandboxed Docker container — no setup, no risk. See output instantly without leaving the chat.

### **AI-Generated Challenges**
The AI doesn't just teach — it **tests your understanding** with unique, context-aware coding puzzles.

### **Real-Time Code Review**
Submit your fix and get:
- Confirmation if correct
- Hints if you're stuck
- Explanations of what went wrong and why

### **Dual Learning Modes**
- **Learning Path Mode**: Structured, goal-oriented learning with progress tracking
- **General Chat Mode**: Free-form exploration and instant bug-hunting challenges

---

## How It Works

### **Learning Path Mode**

1. **Choose Your Journey**  
   Browse curated topics like "JavaScript Fundamentals" or "Python Basics" with difficulty indicators and time estimates.

2. **Start Learning**  
   Begin with structured lessons that build on each other, complete with learning objectives and progress tracking.

3. **Interactive Learning**  
   Each lesson includes AI explanations, live code examples in Monaco editor, and hands-on practice.

4. **Challenge Phase**  
   After learning concepts, tackle bug-fixing challenges specifically designed for that topic.

5. **Track Progress**  
   Monitor your advancement through visual dashboards, completion rates, and skill development.

6. **Master & Advance**  
   Complete topics to unlock advanced courses and build comprehensive programming skills.

### **General Chat Mode**

1. **Start a Conversation**  
   Ask anything: *"Explain async/await in Python"* or *"Show me a React component with state."*

2. **Get Live Code**  
   The AI responds with explanation + an embedded code editor. Run it. Break it. Fix it.

3. **Receive a Challenge**  
   "Here's a function that's supposed to reverse a string — but it doesn't work. Can you find the bug?"

4. **Hunt the Bug**  
   Edit the code in the editor. Try different fixes. Run it repeatedly.

5. **Submit & Learn**  
   Click "Submit Solution." The AI runs it, analyzes your fix, and gives personalized feedback.

6. **Explore & Discover**  
   Jump between topics, explore edge cases, and learn through curiosity-driven practice.

---

## 🔧 Tech Stack

| Layer       | Technology |
|------------|-----------|
| **Frontend** | React, TypeScript, Vite, Mantine UI, Monaco Editor |
| **Backend**  | Python, Django, Django Ninja (API), Django Channels (WebSockets) |
| **AI Engine** | Google Gemini API (for explanations, challenges, and code review) |
| **Code Execution** | Docker containers (sandboxed, secure, per-session isolation) |
| **Auth**     | JWT authentication |
| **Tooling**  | `uv` (Python package manager), `yarn` (frontend) |

All code execution happens in isolated, resource-limited containers — safe even if users write infinite loops or malicious code.




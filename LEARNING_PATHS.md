# Learning Paths Feature

## Overview

The Learning Paths feature transforms BugHunt AI from a simple chat-based coding tutor into a structured learning platform. Users can now follow guided learning journeys with progress tracking, challenges, and personalized AI instruction.

## Key Features

### 🎯 **Structured Learning**
- **Topic Selection**: Choose from curated programming topics
- **Subtopic Breakdown**: Each topic is divided into logical learning steps
- **Progressive Difficulty**: Learn at your own pace with clear progression

### 📊 **Progress Tracking**
- **Visual Progress Bars**: See completion percentage for each topic
- **Subtopic Status**: Track learning, challenging, completed, or skipped states
- **Challenge Statistics**: Monitor success rates and attempts

### 🤖 **AI-Powered Teaching**
- **Context-Aware Instruction**: AI knows your current learning objective
- **Phase-Based Learning**: Separate learning and challenge phases
- **Personalized Feedback**: AI adapts to your progress and skill level

### 🎮 **Interactive Challenges**
- **Bug-Fixing Exercises**: Practice with intentionally broken code
- **Hands-On Practice**: Run and test code in real-time
- **Immediate Feedback**: Get instant AI evaluation of your solutions

## User Flow

```
1. Browse Topics → 2. Select Topic → 3. AI Generates Subtopics → 4. Learning Phase
                                                                        ↓
8. Next Subtopic ← 7. Mark Complete ← 6. Challenge Phase ← 5. Start Challenges
```

### Detailed Flow:

1. **Topic Selection**: User browses available topics with difficulty indicators
2. **Learning Path Creation**: AI creates a structured path with subtopics
3. **Learning Phase**: Interactive conversation about the current subtopic
4. **Challenge Phase**: AI provides buggy code for the user to fix
5. **Progress Tracking**: System tracks completion and success rates
6. **Flexible Navigation**: Users can skip, revisit, or advance through topics

## Technical Architecture

### Backend (Django)

#### New Models:
- **LearningTopic**: Main learning subjects (e.g., "JavaScript Fundamentals")
- **LearningSubtopic**: Individual lessons within a topic
- **UserLearningPath**: User's journey through a specific topic
- **SubtopicProgress**: Detailed progress tracking for each subtopic

#### Enhanced Models:
- **Conversation**: Added `conversation_type` field to distinguish learning paths from general chats

#### API Endpoints:
- `GET /api/learning-paths/topics` - Get available topics
- `POST /api/learning-paths/create` - Start a new learning path
- `GET /api/learning-paths/user-paths` - Get user's active learning paths
- `PUT /api/learning-paths/{id}/progress` - Update progress

### Frontend (React + TypeScript)

#### New Components:
- **TopicSelection**: Browse and select learning topics
- **LearningPathDashboard**: View progress and navigate subtopics
- **Enhanced Sidebar**: Shows active learning paths with progress
- **Enhanced ChatContainer**: Learning-aware chat interface

#### Key Features:
- **Progress Visualization**: Progress bars and completion indicators
- **Learning Context**: Chat shows current topic and subtopic
- **Phase Controls**: Buttons to transition between learning and challenge phases
- **Flexible Navigation**: Skip, complete, or revisit subtopics

## Sample Learning Topics

### 1. JavaScript Fundamentals (Beginner)
- Variables and Data Types
- Functions and Scope
- Objects and Arrays
- Control Flow and Loops
- DOM Manipulation

### 2. Python Programming Basics (Beginner)
- Python Syntax and Variables
- Data Structures
- Functions and Modules
- Control Flow
- Object-Oriented Programming
- File Handling and Exceptions

### 3. React Fundamentals (Intermediate)
- Components and JSX
- State and Event Handling
- React Hooks
- Component Lifecycle
- Routing and Navigation

## Getting Started

### For Developers

1. **Run Migrations**:
   ```bash
   cd backend
   python manage.py makemigrations learning_paths
   python manage.py makemigrations ai_core
   python manage.py migrate
   ```

2. **Create Sample Data**:
   ```bash
   python manage.py create_sample_topics
   ```

3. **Start Development Servers**:
   ```bash
   # Backend
   cd backend
   python manage.py runserver
   
   # Frontend
   cd frontend
   npm run dev
   ```

### For Users

1. **Start Learning**: Click "Start Learning Path" in the sidebar
2. **Choose Topic**: Browse topics by difficulty and prerequisites
3. **Begin Journey**: Follow the structured path with AI guidance
4. **Track Progress**: Monitor your advancement through the dashboard
5. **Practice & Challenge**: Engage with interactive coding exercises

## Future Enhancements

- **AI Topic Generation**: Let AI create custom learning paths based on user goals
- **Certificates & Badges**: Reward system for completed learning paths
- **Community Features**: Share progress and compete with other learners
- **Advanced Analytics**: Detailed learning insights and recommendations
- **Multi-Language Support**: Expand beyond JavaScript, Python, and React
- **Adaptive Difficulty**: AI adjusts challenge difficulty based on performance

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Required for AI-powered teaching and challenge generation
- Database settings for storing learning progress

### Admin Interface
Access Django admin at `/admin/` to:
- Create and manage learning topics
- Monitor user progress
- Analyze learning patterns
- Add new subtopics and challenges

## Testing

Run the test suite:
```bash
cd backend
python manage.py test learning_paths
```

## Support

For issues or questions about the Learning Paths feature:
1. Check the Django admin for data integrity
2. Verify API endpoints are responding correctly
3. Ensure frontend components are properly connected to the API
4. Review browser console for any JavaScript errors

---

**Happy Learning!** 🚀📚

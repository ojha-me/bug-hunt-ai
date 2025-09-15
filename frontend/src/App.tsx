
import Editor from '@monaco-editor/react';

function App() {
  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col p-4 gap-4">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-cyan-400">BugHunt AI</h1>
        <p className="text-gray-400">The AI-powered coding challenge</p>
      </header>
      
      <main className="flex-grow flex gap-4">
        {/* Left Side: Code Editor */}
        <div className="w-1/2 bg-gray-800 rounded-lg">
  <Editor
    height="100%"
    theme="vs-dark"
    defaultLanguage="javascript"
    defaultValue="// Start your hunt here..."
  />
</div>
        
        {/* Right Side: AI and Console */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="flex-grow bg-gray-800 rounded-lg p-2">
            AI Feedback
          </div>
          <div className="h-1/3 bg-gray-800 rounded-lg p-2">
            Console Output
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
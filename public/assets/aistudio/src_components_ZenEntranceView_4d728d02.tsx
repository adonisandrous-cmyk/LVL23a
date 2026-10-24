return (
  <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
    <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-slate-900">
            <span className="text-sm font-black text-amber-300">L23</span>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Legal AI
            </div>
            <div className="text-sm font-semibold text-white">
              Level 23 Co-Counsel
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onActivateWorkspace('dashboard')}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-amber-500/50"
          >
            Workspace
          </button>

          <button
            type="button"
            onClick={() => onActivateWorkspace('documents')}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-amber-500/50"
          >
            Documents
          </button>

          <button
            type="button"
            onClick={() => onActivateWorkspace('matters')}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-amber-500/50"
          >
            Matters
          </button>

          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950"
          >
            {systemConnected ? 'AI Ready' : 'Standby'}
          </button>
        </div>
      </div>
    </div>

    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl border border-amber-500/40 bg-slate-900" />
        <h2 className="text-2xl font-semibold text-white">
          How can I help with this matter?
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Review files, draft documents, and move work forward.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {ZEN_AGENTS.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgent(agent.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {agent.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="h-full overflow-y-auto space-y-3">
          {chatThread.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              Start with a matter, file, or question.
            </div>
          ) : (
            chatThread.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-slate-700 bg-slate-950 text-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-2"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask ${selectedAgent} anything...`}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`rounded-xl border p-2 ${
              isListening
                ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                : 'border-slate-700 bg-slate-800 text-slate-200'
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>

          <button
            type="submit"
            disabled={(!inputPrompt.trim() && !attachedFile) || isSubmitting}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSend('Draft a concise legal summary for this matter.')}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
        >
          Draft summary
        </button>
        <button
          type="button"
          onClick={() => handleSend('Review the attached file for risks and missing facts.')}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
        >
          Review file
        </button>
        <button
          type="button"
          onClick={() => onActivateWorkspace('documents')}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
        >
          Open docs
        </button>
      </div>
    </main>
  </div>
);
import fs from 'fs';

let content = fs.readFileSync('src/components/ClientsTab.tsx', 'utf8');

// 1. Insert Roster Tab Button
const marker = '<span>📇 Populated Client Intake Card</span>                 </button>';
const rosterButton = `<span>📇 Populated Client Intake Card</span>                 </button>
                  <button
                    type="button"
                    id="tab-client-roster"
                    onClick={() => setActiveSubView('roster')}
                    className={'px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer shrink-0 ' + (
                      activeSubView === 'roster'
                        ? 'text-teal-400 border-teal-500 bg-[#14b8a6]/5'
                        : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                    )}
                  >
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>👥 Active Client Roster</span>
                  </button>`;

if (content.includes(marker)) {
  content = content.replace(marker, rosterButton);
  console.log('Roster Button Inserted!');
} else {
  console.log('Marker not found');
}

// 2. Insert Active Roster View branch before activeSubView === 'files'
const filesMarker = ") : activeSubView === 'files' ? (";
const rosterView = `) : activeSubView === 'roster' ? (
                /* FULL ACTIVE CLIENT ROSTER VIEW */
                <div id="client-roster-full-view" className="p-6 space-y-5 flex-1 select-text">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-400" />
                        <h3 className="text-sm font-heading font-black text-white tracking-wide uppercase">
                          Active Client Roster & Firm Directory
                        </h3>
                        <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          {clients.length} Retained Clients
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Complete directory of active matters, contacts, Google Drive folders, and case statuses.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btn-roster-quick-intake"
                      onClick={() => setIsIntakeOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-[#090d16] rounded-xl text-xs font-bold font-mono transition shadow flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Client Intake</span>
                    </button>
                  </div>

                  {/* Search and Filter in Roster View */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search roster by name, email, phone, or matter ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={'px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ' + (
                            statusFilter === status
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : 'bg-[#090d16] text-slate-400 border border-[#1e293b] hover:text-slate-200'
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Roster Table */}
                  <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#090d16]/80">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1e293b] bg-[#070b13] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          <th className="p-3.5">Client & Matter</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Contact</th>
                          <th className="p-3.5">Retainer</th>
                          <th className="p-3.5">Drive Sync</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/60">
                        {filteredClients.map((client) => {
                          const isSelected = selectedClient?.id === client.id;
                          return (
                            <tr
                              key={client.id}
                              onClick={() => {
                                setSelectedClient(client);
                                setActiveSubView('card');
                              }}
                              className={'group transition-colors cursor-pointer ' + (
                                isSelected ? 'bg-teal-500/10' : 'hover:bg-[#0e1626]/70'
                              )}
                            >
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e293b] to-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0 border border-slate-700">
                                    {client.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors font-sans text-xs">
                                      {client.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      ID: {client.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className={'px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ' + (
                                  client.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : client.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                )}>
                                  {client.status}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="text-slate-300 text-[11px] font-mono">{client.email}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{client.phone}</div>
                              </td>
                              <td className="p-3.5">
                                <div className="text-slate-200 font-mono font-bold text-[11px]">{client.retainerAmount}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{client.billingType}</div>
                              </td>
                              <td className="p-3.5">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  1EW-bOXh5e...
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClient(client);
                                    setActiveSubView('card');
                                  }}
                                  className="px-2.5 py-1 bg-slate-800/60 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                                >
                                  Open Card →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` + filesMarker;

if (content.includes(filesMarker)) {
  content = content.replace(filesMarker, rosterView);
  console.log('Roster Full View Injected!');
} else {
  console.log('filesMarker not found');
}

fs.writeFileSync('src/components/ClientsTab.tsx', content, 'utf8');
console.log('Done!');

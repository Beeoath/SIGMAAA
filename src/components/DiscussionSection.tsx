import React, { useState, useEffect } from 'react';
import { DiscussionThread, UserProfile, LearningModule, AvatarConfig } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  MessageSquare, 
  ThumbsUp, 
  Pin, 
  Send, 
  ShieldCheck, 
  CornerDownRight, 
  Filter, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface DiscussionSectionProps {
  user: UserProfile;
  activeModuleId?: string;
  modules: LearningModule[];
}

export const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  user,
  activeModuleId,
  modules,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>(activeModuleId || 'all');
  const [threads, setThreads] = useState<DiscussionThread[]>(SupabaseService.getCachedDiscussions());
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [targetModuleId, setTargetModuleId] = useState<string>(activeModuleId || modules[0]?.id || 'mod-1');
  const [replyContentMap, setReplyContentMap] = useState<Record<string, string>>({});
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);

  const refreshThreads = async () => {
    try {
      const list = await SupabaseService.getDiscussions();
      setThreads(list);
    } catch (err) {
      console.warn('Failed to fetch discussions:', err);
    }
  };

  useEffect(() => {
    refreshThreads();
  }, []);

  const filteredThreads = threads.filter(t => {
    if (selectedModuleFilter === 'all') return true;
    return t.moduleId === selectedModuleFilter;
  });

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const authorAvatarConfig: AvatarConfig = {
      ...user.avatarConfig,
      photoUrl: user.photoUrl || user.avatarConfig.photoUrl,
    };

    await SupabaseService.createDiscussionThread({
      moduleId: targetModuleId,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: authorAvatarConfig,
      title: newTitle.trim(),
      content: newContent.trim(),
    });

    setNewTitle('');
    setNewContent('');
    await refreshThreads();
  };

  const handleAddReply = async (threadId: string) => {
    const text = replyContentMap[threadId];
    if (!text || !text.trim()) return;

    const authorAvatarConfig: AvatarConfig = {
      ...user.avatarConfig,
      photoUrl: user.photoUrl || user.avatarConfig.photoUrl,
    };

    await SupabaseService.addReply(threadId, {
      threadId,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: authorAvatarConfig,
      content: text.trim(),
    });

    setReplyContentMap(prev => ({ ...prev, [threadId]: '' }));
    setActiveReplyThreadId(null);
    await refreshThreads();
  };

  const handleToggleUpvote = async (threadId: string, replyId?: string) => {
    await SupabaseService.toggleUpvote(threadId, replyId);
    await refreshThreads();
  };

  const handleTogglePin = async (threadId: string) => {
    if (user.role !== 'teacher') return;
    await SupabaseService.togglePinThread(threadId);
    await refreshThreads();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F1F1F]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Forum Diskusi & Konsultasi TKA
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              MAS DARUNNAJAH 9
            </span>
          </div>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Ajukan pertanyaan matematis dengan nama asli. Didampingi oleh Tim PKM Matematika UNPAM.
          </p>
        </div>

        {/* Module Filter Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#737373]" />
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="bg-[#161616] text-xs text-white border border-[#262626] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#10B981]"
          >
            <option value="all">Semua Modul TKA</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>
                Modul {m.orderIndex}: {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* New Question Box */}
      <div className="my-6 p-5 rounded-xl bg-[#141414] border border-[#222222] shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#10B981] mb-3 flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tulis Pertanyaan atau Diskusi Baru</span>
        </h3>

        <form onSubmit={handleCreateThread} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Judul pertanyaan (misal: Bingung pada rumus cepat invers rasional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#282828] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5A5A5A] focus:outline-none focus:border-[#10B981]"
                required
              />
            </div>
            <div>
              <select
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#282828] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10B981]"
              >
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    Modul {m.orderIndex}: {m.title.split('&')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            placeholder="Jelaskan pertanyaan matematika atau kendala yang dihadapi secara rinci..."
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#282828] rounded-lg p-3 text-xs text-white placeholder-[#5A5A5A] focus:outline-none focus:border-[#10B981]"
            required
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#666666]">
              Posting sebagai: <strong className="text-[#A3A3A3]">{user.name}</strong> ({user.role === 'teacher' ? 'Guru / PKM' : 'Siswa XI'})
            </span>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Kirim Pertanyaan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-[#141414] border border-[#222222] text-[#737373]">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-[#10B981]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Forum Diskusi Masih Kosong</p>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
              Belum ada topik diskusi yang dibuat. Silakan ajukan pertanyaan atau bagikan catatan pembahasan matematika TKA menggunakan formulir di atas!
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const moduleInfo = modules.find(m => m.id === thread.moduleId);
            const hasUserUpvoted = thread.upvotes.includes(user.id);
            const isTeacherThread = thread.authorRole === 'teacher';

            return (
              <div
                key={thread.id}
                className={`rounded-xl border p-5 transition-colors ${
                  thread.isPinnedByTeacher 
                    ? 'bg-[#151C17] border-[#10B981]/40' 
                    : 'bg-[#141414] border-[#222222]'
                }`}
              >
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2.5">
                    {/* Author Avatar with Photo or Glyph */}
                    <UserAvatar
                      avatarConfig={thread.authorAvatar}
                      photoUrl={thread.authorAvatar.photoUrl}
                      name={thread.authorName}
                      size="sm"
                    />

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          {thread.authorName}
                        </span>
                        {isTeacherThread && (
                          <span className="flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                            GURU / PKM
                          </span>
                        )}
                        <span className="text-[10px] text-[#666666]">
                          · {new Date(thread.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#10B981]">
                        {moduleInfo ? `Modul ${moduleInfo.orderIndex}: ${moduleInfo.title}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Pinned Indicator / Moderator Actions */}
                  <div className="flex items-center space-x-2">
                    {thread.isPinnedByTeacher && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981] text-[#0D0D0D]">
                        <Pin className="w-3 h-3" />
                        <span>Disematkan Guru</span>
                      </span>
                    )}

                    {user.role === 'teacher' && (
                      <button
                        onClick={() => handleTogglePin(thread.id)}
                        className={`text-xs p-1 rounded hover:bg-[#222222] transition-colors ${
                          thread.isPinnedByTeacher ? 'text-[#10B981]' : 'text-[#666666]'
                        }`}
                        title={thread.isPinnedByTeacher ? 'Lepas sematan' : 'Sematkan diskusi'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Thread Title & Content */}
                <h4 className="text-sm font-bold text-white mb-1.5">
                  {thread.title}
                </h4>
                <p className="text-xs text-[#CCCCCC] leading-relaxed mb-4 whitespace-pre-line">
                  {thread.content}
                </p>

                {/* Thread Actions (Upvotes, Reply count, Reply button) */}
                <div className="flex items-center space-x-4 pt-3 border-t border-[#1C1C1C] text-xs">
                  <button
                    onClick={() => handleToggleUpvote(thread.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                      hasUserUpvoted 
                        ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/60 font-semibold' 
                        : 'bg-[#181818] text-[#888888] hover:text-white border-[#2A2A2A]'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{thread.upvotes.length} Upvote</span>
                  </button>

                  <button
                    onClick={() => setActiveReplyThreadId(activeReplyThreadId === thread.id ? null : thread.id)}
                    className="flex items-center space-x-1 text-[#888888] hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-3 h-3 text-[#10B981]" />
                    <span>{thread.replies.length} Balasan</span>
                  </button>
                </div>

                {/* Thread Replies List */}
                {thread.replies.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1C1C1C] space-y-3 pl-3 sm:pl-6">
                    {thread.replies.map(reply => {
                      const hasReplyUpvoted = reply.upvotes.includes(user.id);
                      return (
                        <div key={reply.id} className="p-3 rounded-lg bg-[#101010] border border-[#1E1E1E]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <UserAvatar
                                avatarConfig={reply.authorAvatar}
                                photoUrl={reply.authorAvatar?.photoUrl}
                                name={reply.authorName}
                                size="xs"
                              />
                              <span className="text-xs font-semibold text-white">
                                {reply.authorName}
                              </span>
                              {reply.authorRole === 'teacher' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981]">
                                  GURU / PKM
                                </span>
                              )}
                              <span className="text-[10px] text-[#666666]">
                                · {new Date(reply.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <button
                              onClick={() => handleToggleUpvote(thread.id, reply.id)}
                              className={`flex items-center space-x-1 text-[11px] ${
                                hasReplyUpvoted ? 'text-[#10B981] font-bold' : 'text-[#666666] hover:text-[#AAAAAA]'
                              }`}
                            >
                              <ThumbsUp className="w-2.5 h-2.5" />
                              <span>{reply.upvotes.length}</span>
                            </button>
                          </div>
                          <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input Box */}
                {activeReplyThreadId === thread.id && (
                  <div className="mt-4 pt-3 border-t border-[#1C1C1C] pl-3 sm:pl-6">
                    <div className="flex items-start space-x-2">
                      <CornerDownRight className="w-4 h-4 text-[#10B981] mt-2 flex-shrink-0" />
                      <div className="flex-grow space-y-2">
                        <textarea
                          placeholder={`Tulis balasan penjelasan untuk ${thread.authorName}...`}
                          rows={2}
                          value={replyContentMap[thread.id] || ''}
                          onChange={(e) => setReplyContentMap({ ...replyContentMap, [thread.id]: e.target.value })}
                          className="w-full bg-[#0D0D0D] border border-[#282828] rounded-lg p-2.5 text-xs text-white placeholder-[#5A5A5A] focus:outline-none focus:border-[#10B981]"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setActiveReplyThreadId(null)}
                            className="px-3 py-1 rounded-full text-xs text-[#737373] hover:text-white"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleAddReply(thread.id)}
                            className="px-3.5 py-1 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-bold uppercase tracking-wider"
                          >
                            Kirim Balasan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

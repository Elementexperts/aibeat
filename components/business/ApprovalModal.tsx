'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { AGENT_REGISTRY } from '@/lib/business/agents'
import type { Approval } from '@/lib/business/types'

export function ApprovalModal({ approval, open, simulated, onClose, onDecide }: { approval?: Approval; open: boolean; simulated: boolean; onClose: () => void; onDecide: (approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED', editedContent?: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || !approval) return
    setEditing(false)
    setContent(approval.editedContent ?? approval.generatedContent)
    closeButton.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [approval, open, onClose])

  if (!open || !approval) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="approval-modal-title" className="flex max-h-[96dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-white/10 bg-[#101820] shadow-2xl sm:max-h-[90vh] sm:rounded-xl">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">Approval required</p><h2 id="approval-modal-title" className="mt-1 text-xl font-black text-white">{AGENT_REGISTRY[approval.agentType].name}</h2><p className="mt-1 text-sm text-slate-400">{approval.affectedEntity}</p></div>
        <button ref={closeButton} type="button" aria-label="Close approval dialog" onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {simulated && <div className="flex gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-50"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><strong>Simulated action — no external {approval.targetSystem} write will occur.</strong></div>}
        <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AIBeat recommends</p><p className="mt-1 font-semibold text-white">{approval.proposedAction}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Why approval is required</p><p className="mt-1 text-sm leading-6 text-slate-300">{approval.reason}</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><Detail label="Risk level" value={approval.risk} /><Detail label="Target system" value={approval.targetSystem} /></div>
        <div><label htmlFor="approval-content" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proposed content</label>{editing ? <textarea id="approval-content" rows={8} value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 w-full resize-y rounded-md border border-cyan-300/30 bg-black/30 p-3 text-sm leading-6 text-white" /> : <p id="approval-content" className="mt-2 whitespace-pre-wrap rounded-md border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200">{approval.generatedContent}</p>}</div>
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => onDecide(approval, 'REJECTED')} className="rounded-md border border-rose-300/30 px-4 py-2.5 text-sm font-black text-rose-100">Reject</button>
        {editing ? <button type="button" disabled={!content.trim()} onClick={() => onDecide(approval, 'EDITED', content.trim())} className="rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:bg-slate-700">Submit edited content</button> : <button type="button" onClick={() => setEditing(true)} className="rounded-md border border-cyan-300/30 px-4 py-2.5 text-sm font-black text-cyan-100">Edit</button>}
        <button type="button" onClick={() => onDecide(approval, 'APPROVED')} className="rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950">Approve</button>
      </footer>
    </section>
  </div>
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-white/10 bg-white/[0.03] p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div> }

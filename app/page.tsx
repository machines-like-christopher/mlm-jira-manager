import { KanbanBoard } from "@/components/kanban-board"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 p-4 md:p-6">
        <KanbanBoard />
      </div>
    </main>
  )
}

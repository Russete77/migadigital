import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirecionar para AI Observatory Overview por padrão
  redirect('/admin/ai-observatory/overview');
}

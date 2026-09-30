import { redirect } from 'next/navigation'

export default function LegacyBoostCreatePage() {
  redirect('/campaigns/new')
}

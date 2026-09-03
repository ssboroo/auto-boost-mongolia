import type { ReactNode } from 'react'
import styles from './dashboard.module.css'

export default function StatCard({ icon, value, label, trend }: { icon: ReactNode; value: string; label: string; trend: string }) {
  return <article className={styles.statCard}><span className={styles.statIcon}>{icon}</span><div><b>{value}</b><small>{label}</small><em>{trend}</em></div></article>
}

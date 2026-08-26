import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: '93vbcg5t',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: true,
})

import type { Metadata } from 'next';
import ArchitectureDiagram from '@/views/tools/ArchitectureDiagram';

export const metadata: Metadata = {
  title: 'Architecture Diagram Generator',
  description: 'Generate architecture diagrams from your repository structure using AI.',
  robots: { index: false, follow: false },
};

export default function ArchitectureDiagramPage() {
  return <ArchitectureDiagram />;
}

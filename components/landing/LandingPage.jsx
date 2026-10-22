import { cn } from '@/lib/utils'
import SiteNav from './SiteNav'
import Hero from './Hero'
import SourcesStrip from './SourcesStrip'
import ToolsJourney from './ToolsJourney'
import ResumeCheckSection from './sections/ResumeCheckSection'
import PortfolioSection from './sections/PortfolioSection'
import CoverLetterSection from './sections/CoverLetterSection'
import OutreachSection from './sections/OutreachSection'
import InterviewSection from './sections/InterviewSection'
import PricingSection from './sections/PricingSection'
import FaqSection from './sections/FaqSection'
import ClosingSection from './sections/ClosingSection'
import SiteFooter from './sections/SiteFooter'

function Container({ className, children }) {
  return <div className={cn('mx-auto max-w-[1240px] px-5 sm:px-8', className)}>{children}</div>
}

export default function LandingPage() {
  return (
    <div className="rmx min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <Container>
          <SourcesStrip />
          <ToolsJourney>
            <ResumeCheckSection />
            <PortfolioSection />
            <CoverLetterSection />
            <OutreachSection />
            <InterviewSection />
          </ToolsJourney>
        </Container>
        <Container className="pt-24 lg:pt-32"><PricingSection /></Container>
        <Container className="pt-24 lg:pt-32"><FaqSection /></Container>
        <Container className="py-24 lg:py-32"><ClosingSection /></Container>
      </main>
      <Container><SiteFooter /></Container>
    </div>
  )
}

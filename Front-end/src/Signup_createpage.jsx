import { useEffect, useRef, useState } from 'react'
import './Signup_createpage.css'

const translations = [
  { word: 'Welcome', color: '#f6c177' }, { word: 'స్వాగతం', color: '#78dce8' }, { word: 'स्वागत', color: '#f38ba8' },
  { word: 'வரவேற்பு', color: '#a6e3a1' }, { word: 'സ്വാഗതം', color: '#f9e2af' }, { word: 'স্বাগতম', color: '#cba6f7' },
  { word: 'ಸ್ವಾಗತ', color: '#94e2d5' }, { word: 'خوش آمدید', color: '#74c7ec' },
]

const exchangeSteps = [
  { title: 'Discover a skill', text: 'Search for people who know the practical thing you want to learn, from photography and baking to React and public speaking.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85', alt: 'A developer working at a laptop' },
  { title: 'Start with a conversation', text: 'Ask a question, share your goal, and make learning feel personal instead of like another one-size-fits-all course.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85', alt: 'People collaborating around a laptop' },
  { title: 'Swap what you know', text: 'Teach something useful in return. A good SkillSwap lets both people leave with a new ability and a stronger learning circle.', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85', alt: 'A student learning from an open book' },
]

function SignupCreatePage({ onContinue, onCreateAccount }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const backgroundRef = useRef(null)

  useEffect(() => {
    let halo
    let cancelled = false
    const loadScript = (src) => new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve()
        else existing.addEventListener('load', resolve, { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.onload = () => { script.dataset.loaded = 'true'; resolve() }
      script.onerror = reject
      document.body.appendChild(script)
    })
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js'))
      .then(() => {
        if (!cancelled && backgroundRef.current && window.VANTA) {
          halo = window.VANTA.HALO({ el: backgroundRef.current, mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200, minWidth: 200, amplitudeFactor: 1.1, xOffset: -0.025, yOffset: -0.025, size: 1 })
        }
      }).catch(() => {})
    return () => { cancelled = true; if (halo) halo.destroy() }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setActiveIndex((current) => (current + 1) % translations.length), 2100)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollProgress(Math.min(window.scrollY / 360, 1))
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const activeTranslation = translations[activeIndex]
  const selectedStep = exchangeSteps[activeStep]

  return <main className="welcome-page">
    <section className="welcome-hero" aria-labelledby="welcome-title">
      <div className="welcome-brandmark" aria-label="Skillverse logo"><img src="/logo.png" alt="Skillverse logo" /></div>
      <div ref={backgroundRef} id="welcome-background" className="welcome-background" style={{ opacity: 1 - scrollProgress, transform: `scale(${1 + scrollProgress * 0.08})` }} aria-hidden="true" />
      <div className="welcome-shade" style={{ opacity: 1 - scrollProgress * 0.68 }} aria-hidden="true" />
      <div className="welcome-content" style={{ opacity: 1 - scrollProgress * 1.3, transform: `translateY(${scrollProgress * -42}px)` }}>
        <p className="welcome-kicker">A living universe of shared skills</p>
        <h1 id="welcome-title" className="welcome-title"><span className="welcome-reel" style={{ '--word-color': activeTranslation.color }} aria-live="polite"><span key={activeIndex} className="human-word">{activeTranslation.word}</span></span></h1>
        <p className="welcome-subtitle">A place to learn openly, build boldly, and meet the people shaping what comes next.</p>
        <div className="welcome-actions"><button type="button" className="welcome-button primary" onClick={onContinue}>Login</button><button type="button" className="welcome-button secondary" onClick={onCreateAccount}>Create new account</button></div>
        <a className="welcome-scroll-cue" href="#skillverse-story">Scroll to see how SkillSwap works <span aria-hidden="true">↓</span></a>
      </div>
    </section>

    <section id="skillverse-story" className="welcome-story" aria-labelledby="skillverse-story-title">
      <div className="welcome-story-copy">
        <p className="welcome-kicker">Learning belongs to everyone</p>
        <h2 id="skillverse-story-title">A universe that makes room for the skills people already carry.</h2>
        <p>At skillverse, we believe that skills shouldn&apos;t be locked behind expensive certifications, long waiting lists, or rigid classrooms. Anyone who knows something valuable should be able to teach it, and anyone curious enough to learn should be able to access it — simply and without barriers.</p>
        <p>In a world where knowledge is often gatekept by degrees and price tags, we wanted to build something different: a place where learning feels open, human, and within everyone&apos;s reach.</p>
      </div>
      <div className="welcome-swap-card"><p className="welcome-kicker">Why SkillSwap matters</p><h2>Knowledge grows when it moves.</h2><p>SkillSwap turns learning into a two-way exchange. Instead of paying a gatekeeper, people trade time, experience, and practical know-how — so every conversation can unlock value for both learners.</p><div className="swap-pills" aria-label="Examples of skills that can be swapped"><span>Camera basics</span><span>Portfolio feedback</span><span>Excel shortcuts</span><span>Home cooking</span></div></div>
    </section>

    <section className="welcome-how" aria-labelledby="welcome-how-title">
      <div className="welcome-how-heading"><p className="welcome-kicker">How the website works</p><h2 id="welcome-how-title">Choose a path. Watch the exchange come to life.</h2></div>
      <div className="welcome-how-layout">
        <div className="welcome-how-controls" role="tablist" aria-label="SkillSwap steps">{exchangeSteps.map((step, index) => <button key={step.title} type="button" className={activeStep === index ? 'active' : ''} onClick={() => setActiveStep(index)} role="tab" aria-selected={activeStep === index}><span>0{index + 1}</span><strong>{step.title}</strong><small>{activeStep === index ? step.text : 'Select to explore'}</small></button>)}</div>
        <div className="welcome-how-visual" aria-live="polite"><img key={selectedStep.title} src={selectedStep.image} alt={selectedStep.alt} /><div className="welcome-how-caption"><span>SkillSwap / 0{activeStep + 1}</span><strong>{selectedStep.title}</strong></div></div>
      </div>
    </section>
  </main>
}

export default SignupCreatePage

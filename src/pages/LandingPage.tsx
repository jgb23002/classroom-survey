import { LinkButton } from '../components/Button';
import { Icon } from '../components/Icon';
import { usePageTitle } from '../hooks/usePageTitle';

const steps = [
  {
    number: '01',
    title: 'Prepare a question',
    description:
      'A quick concept check. A true-or-false prompt. Start with what you want to understand.',
    icon: 'book',
  },
  {
    number: '02',
    title: 'Invite every voice',
    description:
      'Share a survey link or QR code. Students join from their own device, without an account.',
    icon: 'message',
  },
  {
    number: '03',
    title: 'Find your next step',
    description:
      'Bring the responses together and use a clearer view of the room to guide your teaching.',
    icon: 'chart',
  },
] as const;

export function LandingPage() {
  usePageTitle('A clearer picture of your classroom');

  return (
    <div className="page-container">
      <section
        aria-labelledby="hero-title"
        className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:py-24"
      >
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-700" /> Made for the classroom
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-2xl text-[clamp(2.8rem,5.3vw,5rem)] leading-[1.06] font-semibold tracking-[-0.055em] text-ink"
          >
            A clearer picture of your{' '}
            <span className="font-editorial font-normal italic text-brand-800">classroom.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
            Make room for every student’s understanding. Simple surveys to help you ask, listen, and
            decide what comes next.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <LinkButton to="/login" className="px-6">
              Instructor login <Icon name="arrow" className="size-4" />
            </LinkButton>
            <a href="#how-it-works" className="text-link">
              How it works <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="mt-5 text-sm text-muted">
            Coming soon. Instructor sign-in is being prepared.
          </p>
        </div>
        <aside
          aria-labelledby="classroom-loop"
          className="relative overflow-hidden rounded-[2rem] bg-brand-800 px-7 py-9 text-white sm:px-10 sm:py-12"
        >
          <div
            aria-hidden="true"
            className="absolute -top-14 -right-14 size-64 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -top-5 -right-5 size-44 rounded-full border border-white/10"
          />
          <p
            id="classroom-loop"
            className="relative text-xs font-semibold tracking-[0.2em] uppercase text-brand-100"
          >
            The classroom loop
          </p>
          <p className="relative mt-10 font-editorial text-5xl leading-[1.12] tracking-tight sm:text-6xl">
            Ask a little.
            <br />
            Understand
            <br />
            <span className="text-brand-200">a lot more.</span>
          </p>
          <div className="relative mt-10 flex items-center gap-4 border-t border-white/20 pt-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/25">
              <Icon name="message" className="size-5" />
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-brand-100">
              Less friction between a good question and a useful conversation.
            </p>
          </div>
        </aside>
      </section>
      <section
        id="how-it-works"
        aria-labelledby="how-title"
        className="scroll-mt-8 border-t border-line py-12 sm:py-16"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">A simple rhythm</p>
            <h2 id="how-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              More listening. Less setup.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Designed for the small checks that make a difference during class.
          </p>
        </div>
        <ol className="mt-9 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="rounded-2xl border border-line bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                  <Icon name={step.icon} />
                </span>
                <span className="font-mono text-xs text-muted">{step.number}</span>
              </div>
              <h3 className="mt-7 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-7 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <Icon name="lock" className="size-4 shrink-0" /> Built around anonymous student
          participation.
        </p>
      </section>
    </div>
  );
}

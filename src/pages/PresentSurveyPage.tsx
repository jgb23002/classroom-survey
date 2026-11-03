import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Link, useParams } from 'react-router';
import { Button, LinkButton } from '../components/Button';
import { SurveyStatusBadge } from '../components/SurveyStatusBadge';
import { usePageTitle } from '../hooks/usePageTitle';
import { activateSurvey, closeSurvey, getPresentationSurvey } from '../services/surveys';
import type { PresentationSurvey } from '../types/presentation';
import { isLocalPublicUrl, publicSurveyUrl, qrDownloadName } from '../utilities/presentation';

const countRefreshMilliseconds = 5_000;

export function PresentSurveyPage() {
  const { id } = useParams<{ id: string }>();
  usePageTitle('Present survey');
  const panelRef = useRef<HTMLElement>(null);
  const [survey, setSurvey] = useState<PresentationSurvey | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [countError, setCountError] = useState(false);
  const [notice, setNotice] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!id) {
        setError('This presentation link is invalid.');
        setLoading(false);
        return;
      }
      try {
        const loaded = await getPresentationSurvey(id);
        setSurvey(loaded);
        setCountError(false);
        if (!quiet) setError('');
      } catch (caught) {
        if (quiet) setCountError(true);
        else
          setError(
            caught instanceof Error ? caught.message : 'The presentation could not be loaded.',
          );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => {
        setError('This presentation link is invalid.');
        setLoading(false);
      });
      return;
    }
    let current = true;
    void getPresentationSurvey(id)
      .then((loaded) => {
        if (current) setSurvey(loaded);
      })
      .catch((caught: unknown) => {
        if (current)
          setError(
            caught instanceof Error ? caught.message : 'The presentation could not be loaded.',
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    if (survey?.status !== 'active') return;
    const refresh = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    const interval = window.setInterval(refresh, countRefreshMilliseconds);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load, survey?.status]);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const publicUrl = survey?.publicSlug
    ? publicSurveyUrl(survey.publicSlug, window.location.origin)
    : '';

  useEffect(() => {
    let current = true;
    if (!publicUrl) return;
    void QRCode.toDataURL(publicUrl, {
      width: 960,
      margin: 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#173d2e', light: '#ffffff' },
    })
      .then((url) => {
        if (current) setQrDataUrl(url);
      })
      .catch(() => {
        if (current) setError('The QR code could not be generated. The readable URL still works.');
      });
    return () => {
      current = false;
    };
  }, [publicUrl]);

  async function handleActivate() {
    if (!id) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await activateSurvey(id);
      await load();
      setNotice('Survey activated. Any previously active survey was closed.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The survey could not be activated.');
    } finally {
      setWorking(false);
    }
  }

  async function handleClose() {
    if (!id || !survey) return;
    if (
      !window.confirm(
        `Close “${survey.title}”? New student submissions will be rejected immediately after closure completes.`,
      )
    )
      return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await closeSurvey(id);
      await load();
      setNotice('Survey closed. New submissions are no longer accepted.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The survey could not be closed.');
    } finally {
      setWorking(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice('Public survey URL copied.');
    } catch {
      setError('The browser could not copy the URL. Select and copy the readable URL instead.');
    }
  }

  function handleDownload() {
    if (!qrDataUrl || !survey) return;
    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    anchor.download = qrDownloadName(survey.title);
    anchor.click();
    setNotice('QR code PNG downloaded.');
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panelRef.current?.requestFullscreen();
    } catch {
      setError('Full-screen mode is not available in this browser.');
    }
  }

  if (loading)
    return (
      <p role="status" className="py-20 text-center text-lg text-muted">
        Preparing presentation…
      </p>
    );

  if (!survey)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-semibold">Presentation unavailable</h1>
        <p className="mt-2">{error}</p>
        <Link to="/dashboard" className="text-link mt-4">
          Back to dashboard
        </Link>
      </div>
    );

  const canActivate = survey.status === 'draft' || survey.status === 'closed';
  const active = survey.status === 'active';

  return (
    <section
      ref={panelRef}
      aria-labelledby="presentation-title"
      className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-8 lg:p-10 fullscreen:overflow-auto fullscreen:rounded-none fullscreen:border-0"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Classroom presentation</p>
          <h1
            id="presentation-title"
            className="mt-3 break-words text-3xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {survey.title}
          </h1>
        </div>
        <SurveyStatusBadge status={survey.status} />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-brand-900"
        >
          {notice}
        </p>
      )}

      {!active && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-xl font-semibold">
            {survey.status === 'archived' ? 'This survey is archived' : 'This survey is not active'}
          </h2>
          <p className="mt-2 leading-7">
            {survey.status === 'archived'
              ? 'Archived surveys cannot be activated.'
              : 'Activate it to accept student submissions. Activating it closes the currently active survey.'}
          </p>
          {canActivate && (
            <Button className="mt-5" disabled={working} onClick={() => void handleActivate()}>
              {working ? 'Activating…' : 'Activate survey'}
            </Button>
          )}
        </div>
      )}

      {publicUrl && (
        <div className="mx-auto mt-8 grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(18rem,34rem)_1fr] lg:gap-14">
          <div className="aspect-square overflow-hidden rounded-3xl border-8 border-white bg-white shadow-xl ring-1 ring-line">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code for ${survey.title}`} className="h-full w-full" />
            ) : (
              <div role="status" className="grid h-full place-items-center text-lg text-muted">
                Generating QR code…
              </div>
            )}
          </div>
          <div className="min-w-0 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
              Scan to participate
            </p>
            <a
              href={publicUrl}
              className="mt-4 block break-all text-xl leading-relaxed font-semibold text-brand-900 underline underline-offset-4 sm:text-2xl"
            >
              {publicUrl}
            </a>
            {isLocalPublicUrl(publicUrl) && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                This local URL is for development only. Present from the deployed application so
                student phones receive its public production URL.
              </p>
            )}
            <p className="mt-8 text-2xl font-medium text-muted sm:text-3xl">Responses</p>
            <p className="mt-1 text-6xl font-semibold tracking-tight text-brand-900 sm:text-8xl">
              {survey.responseCount}
            </p>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {countError
                ? 'Count refresh failed; showing the last known count.'
                : active
                  ? 'Updates automatically while this page is visible.'
                  : 'Final recorded count.'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3 border-t border-line pt-7">
        {publicUrl && (
          <>
            <Button variant="secondary" onClick={() => void handleCopy()}>
              Copy URL
            </Button>
            <Button variant="secondary" disabled={!qrDataUrl} onClick={handleDownload}>
              Download QR PNG
            </Button>
          </>
        )}
        <LinkButton to={`/surveys/${survey.id}/results`} variant="secondary">
          View results
        </LinkButton>
        {'fullscreenEnabled' in document && document.fullscreenEnabled && (
          <Button variant="secondary" onClick={() => void toggleFullscreen()}>
            {fullscreen ? 'Exit full screen' : 'Enter full screen'}
          </Button>
        )}
        {active && (
          <Button disabled={working} onClick={() => void handleClose()}>
            {working ? 'Closing…' : 'Close survey'}
          </Button>
        )}
        <LinkButton to="/dashboard" variant="secondary">
          Dashboard
        </LinkButton>
      </div>
    </section>
  );
}

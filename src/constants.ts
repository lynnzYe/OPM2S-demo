export interface DemoPiece {
  id: string;
  title: string;
  description: string;
  liveVideoUrl: string;
  inputMidiUrl: string;
  scoreComparison: Record<'hybrid' | 'liu' | 'beyer', ScoreAsset>;
}

export interface ScoreAsset {
  label: string;
  musicXmlUrl: string;
  audioUrl: string;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'improvisation',
    title: 'Improvisation',
    description: 'Improvised in the key of Ab major in 4/4 meter, this performance employs rubato and expressive timing deviations to convey emotional nuance, demonstrating the capability of neural-network based models in transcribing expressive performances.',
    liveVideoUrl: asset('live/improvisation.mp4'),
    inputMidiUrl: asset('input/improvisation.mid'),
    scoreComparison: {
      hybrid: { label: 'Ours — Hybrid', musicXmlUrl: asset('hybrid/improvisation.musicxml'), audioUrl: asset('hybrid/improvisation.mp3') },
      liu: { label: 'Liu et al.', musicXmlUrl: asset('liu/improvisation.musicxml'), audioUrl: asset('liu/improvisation.mp3') },
      beyer: { label: 'Beyer et al.', musicXmlUrl: asset('beyer/improvisation.musicxml'), audioUrl: asset('beyer/improvisation.mp3') },
    },
  },
  {
    id: 'counterattack',
    title: 'Counterattack',
    description: 'Composed by Kenji Hiramatsu and arranged by the author, this piece challenges the models with complex, out-of-distribution rhythms, alongside the added difficulty of fast running notes and piano tremolos.',
    liveVideoUrl: asset('live/counterattack.mp4'),
    inputMidiUrl: asset('input/counterattack.mid'),
    scoreComparison: {
      hybrid: { label: 'Ours — Hybrid', musicXmlUrl: asset('hybrid/counterattack.musicxml'), audioUrl: asset('hybrid/counterattack.mp3') },
      liu: { label: 'Liu et al.', musicXmlUrl: asset('liu/counterattack.musicxml'), audioUrl: asset('liu/counterattack.mp3') },
      beyer: { label: 'Beyer et al.', musicXmlUrl: asset('beyer/counterattack.musicxml'), audioUrl: asset('beyer/counterattack.mp3') },
    },
  },
  {
    id: 'senbonzakura',
    title: 'Senbonzakura',
    description: 'Composed by Kurousa-P and arranged by marasy, this piece contains highly complex rhythms that all models fail to capture accurately at the introduction of the first verse.',
    liveVideoUrl: asset('live/senbonzakura.mp4'),
    inputMidiUrl: asset('input/senbonzakura.mid'),
    scoreComparison: {
      hybrid: { label: 'Ours — Hybrid', musicXmlUrl: asset('hybrid/senbonzakura.musicxml'), audioUrl: asset('hybrid/senbonzakura.mp3') },
      liu: { label: 'Liu et al.', musicXmlUrl: asset('liu/senbonzakura.musicxml'), audioUrl: asset('liu/senbonzakura.mp3') },
      beyer: { label: 'Beyer et al.', musicXmlUrl: asset('beyer/senbonzakura.musicxml'), audioUrl: asset('beyer/senbonzakura.mp3') },
    },
  },
  {
    id: 'mayu-day',
    title: 'TSUYOGARU OTONANO Secret Labo',
    description: 'Composed by Famishin in D minor (4/4) and arranged by the author, this piece challenges all the models with its swing rhythm. As an out-of-distribution style, it tests the limits of the models\' ability to transcribe non-straight rhythmic patterns.',
    liveVideoUrl: asset('live/mayu-day.mp4'),
    inputMidiUrl: asset('input/mayu-day.mid'),
    scoreComparison: {
      hybrid: { label: 'Ours — Hybrid', musicXmlUrl: asset('hybrid/mayu-day.musicxml'), audioUrl: asset('hybrid/mayu-day.mp3') },
      liu: { label: 'Liu et al.', musicXmlUrl: asset('liu/mayu-day.musicxml'), audioUrl: asset('liu/mayu-day.mp3') },
      beyer: { label: 'Beyer et al.', musicXmlUrl: asset('beyer/mayu-day.musicxml'), audioUrl: asset('beyer/mayu-day.mp3') },
    },
  },
];

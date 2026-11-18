// Optional scene metadata for Replit workspace integrations. When the
// workspace's scene controls are enabled for this project, a viewer's click on
// a scene segment scopes their next chat request to that scene's source file.
// Fill one entry per SCENE_DURATIONS key in VideoTemplate.tsx only when a
// skill reference asks for it; otherwise leave the map empty. Scenes missing
// from the map still play and can be jumped to.
//
// Example:
//   export const SCENE_DETAILS: Record<string, SceneDetails> = {
//     open: { title: 'Intro', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
//   };

export interface SceneDetails {
  title: string;
  filePath: string;
}

export const SCENE_DETAILS: Record<string, SceneDetails> = {
  open: { title: 'Wordmark', filePath: 'src/components/video/scenes/OpenScene.tsx' },
  add: { title: 'Add notes', filePath: 'src/components/video/scenes/AddScene.tsx' },
  extract: { title: 'Source-linked items', filePath: 'src/components/video/scenes/ExtractScene.tsx' },
  review: { title: 'Review', filePath: 'src/components/video/scenes/ReviewScene.tsx' },
  study: { title: 'Study', filePath: 'src/components/video/scenes/StudyScene.tsx' },
  close: { title: 'Privacy close', filePath: 'src/components/video/scenes/CloseScene.tsx' },
};

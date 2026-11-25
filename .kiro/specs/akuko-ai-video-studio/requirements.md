# Requirements Document

## Introduction

AKUKO is a web application that enables users to create long-form videos (30+ minutes) from story ideas using AI models. The system orchestrates AI video generation models, voice synthesis, music, and assembly to produce complete MP4 videos. The application serves storytellers, YouTube creators, small businesses, and educators who need to produce professional-quality videos without technical editing skills.

The product solves three core problems: video tools demand skills beginners lack, AI video models produce short clips with drifting faces preventing coherent long stories, and creators juggle multiple tools and lose work moving between them. AKUKO provides one guided journey from idea to exported MP4, with character consistency, durable state preservation, and provider independence.

## Glossary

- **AKUKO**: The AI Video Studio web application that orchestrates video generation
- **User**: A person who creates videos using AKUKO, belonging to one of four personas (Storyteller, YouTube Creator, Small Business, Educator)
- **Project**: A video production workspace containing characters, script, scenes, timeline, and exports
- **Scene**: A discrete video segment (typically 8-30 seconds) that forms one building block of a long-form video
- **Take**: A single generation attempt for a scene, preserving all attempts for potential selection
- **Character**: A saved persona with visual references, voice settings, and attributes used across multiple scenes
- **Reference Kit**: A locked set of 2-6 approved images per character used to maintain visual consistency
- **Timeline**: The edit decision list defining video, voice, music, and subtitle tracks with clips and transitions
- **Provider Layer**: The abstraction layer that interfaces with AI model providers (video, voice, music, LLM)
- **Workflow Engine**: The durable task execution system (Trigger.dev) that manages long-running generation jobs
- **Storyboard Mode**: Free tier production using AI stills with motion, voice, music, subtitles at 720p with watermark
- **Credits**: Paid currency used to generate real video content, mapped to seconds of video by quality tier
- **Job**: An asynchronous task submitted to the workflow engine for AI generation or rendering
- **Asset**: Any file stored in R2 storage (image, video, audio, subtitle)
- **Export**: An immutable finalized MP4 file produced from an approved timeline

## Requirements

### Requirement 1: User Authentication and Account Management

**User Story:** As a new user, I want to sign up and manage my account, so that I can access AKUKO securely and track my credits.

#### Acceptance Criteria

1. WHEN a new user visits AKUKO, THE Auth_System SHALL display sign-in options for email and Google
2. WHEN a user submits valid email credentials, THE Auth_System SHALL create an account and redirect to the dashboard within 60 seconds
3. WHEN a user signs in with Google, THE Auth_System SHALL authenticate the user and create or link the account
4. THE Auth_System SHALL require email verification before granting access to generation features
5. THE Auth_System SHALL block disposable email domains during registration
6. WHEN a user accesses their profile, THE Auth_System SHALL display credit balance, plan type, and account settings
7. IF an authentication error occurs, THEN THE Auth_System SHALL display a plain-language error message with recovery options

### Requirement 2: Dashboard and Project Management

**User Story:** As a returning user, I want to see my projects and quickly start new ones, so that I can continue my work efficiently.

#### Acceptance Criteria

1. WHEN an authenticated user loads the dashboard, THE Dashboard SHALL display within 2 seconds
2. THE Dashboard SHALL display a Create New Video button as the primary action
3. THE Dashboard SHALL display recent projects showing thumbnail, duration, scene count, and Continue button
4. WHEN a user clicks Continue on a project, THE Dashboard SHALL open that project within 2 clicks
5. THE Dashboard SHALL display a Quick Create option for rapid project initiation
6. THE Dashboard SHALL display a sidebar with navigation to Library, Templates, and Settings
7. WHEN the dashboard has no projects, THE Dashboard SHALL display an empty state with guidance to create the first video

### Requirement 3: Project Setup

**User Story:** As a creator, I want to configure my project settings, so that my video matches my intended format and duration.

#### Acceptance Criteria

1. WHEN a user creates a new project, THE Project_Setup SHALL display fields for name, video type, aspect ratio, and target duration
2. THE Project_Setup SHALL offer aspect ratio options of 16:9 (landscape), 9:16 (vertical), and 1:1 (square)
3. THE Project_Setup SHALL offer target duration options from 5 to 60 minutes with a Custom entry field
4. WHEN a user selects 30 minutes as target duration, THE Project_Setup SHALL accept this with one tap
5. THE Project_Setup SHALL save all settings before the user leaves the screen
6. THE Project_Setup SHALL create a unique project identifier and initialize project status as draft

### Requirement 4: Character Studio

**User Story:** As a storyteller, I want to create and save characters with consistent appearance and voice, so that my characters look and sound the same across all scenes.

#### Acceptance Criteria

1. WHEN a user opens Character Studio, THE Character_Studio SHALL display fields for name, age, gender, appearance, clothing, and personality
2. THE Character_Studio SHALL allow optional upload of reference images for character appearance
3. WHEN a user requests character generation, THE Character_Studio SHALL generate a reference kit of 2-6 images
4. THE Character_Studio SHALL allow preview of generated character before saving
5. THE Character_Studio SHALL offer voice selection with accent, emotion, and speed settings
6. WHEN a user saves a character, THE Character_Studio SHALL store the character with locked reference kit
7. THE Character_Studio SHALL display a character library with Use, Edit, Duplicate, and Delete actions
8. WHEN a saved character appears in 3 different scenes, THE Character_Studio SHALL maintain recognizably consistent appearance
9. THE Character_Studio SHALL allow regeneration of individual reference images without affecting others
10. IF a character is locked after approval, THE Character_Studio SHALL prevent automatic modification of reference images

### Requirement 5: Story and Script Generation

**User Story:** As a creator with a story idea, I want AI to generate a structured story and full script, so that I can develop my concept into a production-ready script.

#### Acceptance Criteria

1. WHEN a user enters a plain-language idea, THE Story_Engine SHALL generate a story with title, summary, characters, conflict, events, climax, and ending
2. THE Story_Engine SHALL use structured JSON output validated against a defined schema
3. IF JSON output fails validation, THE Story_Engine SHALL attempt automatic repair before displaying to user
4. WHEN a user approves the story, THE Story_Engine SHALL generate a full script with dialogue and scene descriptions
5. THE Story_Engine SHALL allow the user to edit story and script content before proceeding
6. WHEN a user edits script content, THE Story_Engine SHALL persist all edits and create a new version
7. THE Story_Engine SHALL preserve edit history with version tracking
8. WHEN script edits are saved, THE Story_Engine SHALL feed updated content to scene planning

### Requirement 6: Scene Builder

**User Story:** As a creator, I want to define individual scenes with specific parameters, so that I have fine-grained control over my video production.

#### Acceptance Criteria

1. WHEN a script is approved, THE Scene_Builder SHALL parse the script into approximately 90 scenes for a 30-minute video
2. THE Scene_Builder SHALL complete scene parsing within 2 minutes for a 30-minute script
3. FOR each scene, THE Scene_Builder SHALL display fields for duration, location, characters, action, dialogue, camera, mood, and visual prompt
4. THE Scene_Builder SHALL allow drag-and-drop reordering of scenes
5. THE Scene_Builder SHALL allow edit, duplicate, regenerate, and delete actions on individual scenes
6. THE Scene_Builder SHALL allow addition of new scenes at any position
7. WHEN scene duration is set, THE Scene_Builder SHALL validate against the selected video model's maximum clip length
8. THE Scene_Builder SHALL calculate and display total estimated video duration from scene durations
9. THE Scene_Builder SHALL store scene position as a sortable key to avoid rewriting all rows on reorder

### Requirement 7: Prompt Assistant

**User Story:** As a creator without technical prompting skills, I want simple text expanded into production prompts, so that I never have to write technical prompts.

#### Acceptance Criteria

1. WHEN a user enters simple text describing a scene, THE Prompt_Assistant SHALL expand it into a production-quality prompt
2. THE Prompt_Assistant SHALL display original user text and AI-expanded prompt side by side
3. THE Prompt_Assistant SHALL offer Accept, Edit, and Regenerate actions for each prompt
4. WHEN a user accepts a prompt, THE Prompt_Assistant SHALL associate the prompt with the scene
5. THE Prompt_Assistant SHALL incorporate character references, location details, and style bible into expanded prompts
6. THE Prompt_Assistant SHALL validate prompt content against content moderation rules before use

### Requirement 8: Long-Form Generation Pipeline

**User Story:** As a creator, I want my 30+ minute video generated scene-by-scene with status tracking, so that I can monitor progress and never lose work.

#### Acceptance Criteria

1. WHEN generation starts, THE Generation_Pipeline SHALL create one job per scene
2. THE Generation_Pipeline SHALL display queue status as Generating, Waiting, Complete, or Failed for each scene
3. THE Generation_Pipeline SHALL display progress as "X of Y scenes" and "MM:SS of HH:MM" generated
4. WHEN the browser is closed mid-generation, THE Generation_Pipeline SHALL preserve all state and allow resumption
5. IF a provider outage occurs, THE Generation_Pipeline SHALL pause the queue without failing the project
6. THE Generation_Pipeline SHALL limit concurrent jobs to provider concurrency limits
7. THE Generation_Pipeline SHALL copy each completed clip to R2 storage immediately upon provider completion
8. THE Generation_Pipeline SHALL checkpoint every step in the workflow engine for resumability
9. WHEN adjacent scenes share a location, THE Generation_Pipeline SHALL start the second scene from the last frame of the first
10. THE Generation_Pipeline SHALL send idempotency key with every provider submission to prevent duplicate jobs
11. THE Generation_Pipeline SHALL de-duplicate webhook deliveries by provider request ID

### Requirement 9: Generation Screen

**User Story:** As a creator, I want a dedicated screen to monitor and control scene generation, so that I have clear visibility into the production process.

#### Acceptance Criteria

1. WHEN a user opens the generation screen, THE Generation_Screen SHALL display scene list on the left, preview in center, and settings on right
2. THE Generation_Screen SHALL display a Generate Scene button for individual scene control
3. WHILE a scene is generating, THE Generation_Screen SHALL display descriptive progress text (never just "Loading")
4. THE Generation_Screen SHALL update scene status in the browser within 3 seconds of database change
5. THE Generation_Screen SHALL use virtualized list rendering for projects with 90-225 scenes
6. THE Generation_Screen SHALL display settings for character, location, duration, style, camera, and aspect ratio
7. WHEN a scene completes, THE Generation_Screen SHALL display the preview automatically

### Requirement 10: Scene Job Execution

**User Story:** As a creator, I want each scene generation job to handle failures gracefully, so that one failure does not stop my entire project.

#### Acceptance Criteria

1. WHEN a scene job starts, THE Scene_Job SHALL validate inputs before submitting to provider
2. IF a network error or 5xx response occurs, THE Scene_Job SHALL retry with exponential backoff up to 3 attempts
3. IF a 4xx validation error occurs, THE Scene_Job SHALL NOT retry and SHALL mark the scene as failed
4. THE Scene_Job SHALL attempt the next model in the registry if the current model fails and user allows
5. WHEN a provider webhook arrives, THE Scene_Job SHALL de-duplicate by provider request ID
6. THE Scene_Job SHALL implement polling fallback every 5-10 seconds in case webhook fails
7. THE Scene_Job SHALL log billed charge for every job attempt
8. IF a scene fails, THE Scene_Job SHALL stop only that scene and allow the queue to continue
9. THE Scene_Job SHALL preserve failed scene prompts and allow Edit Prompt action

### Requirement 11: Video Editor

**User Story:** As a creator, I want to edit my assembled video with timeline controls, so that I can refine my production before export.

#### Acceptance Criteria

1. WHEN a user opens the video editor, THE Video_Editor SHALL display preview on top, assets on left, and timeline at bottom
2. THE Video_Editor SHALL display timeline with Video, Voice, and Music tracks
3. THE Video_Editor SHALL allow trim, split, reorder, delete, duplicate, replace, and regenerate actions on clips
4. THE Video_Editor SHALL allow transitions between scenes
5. WHEN a user trims and reorders 10 scenes, THE Video_Editor SHALL complete without page reload
6. THE Video_Editor SHALL auto-save timeline changes after 2 seconds of inactivity
7. THE Video_Editor SHALL support undo and redo through command history
8. THE Video_Editor SHALL store timeline as a JSON edit decision list
9. THE Video_Editor SHALL support keyboard navigation for accessibility
10. WHILE editing, THE Video_Editor SHALL display low-resolution preview proxies for scrubbing performance

### Requirement 12: Voice, Music, and Sound Effects

**User Story:** As a creator, I want to add voice narration, background music, and sound effects to my video, so that it has professional audio quality.

#### Acceptance Criteria

1. WHEN a user configures voice, THE Audio_System SHALL offer voice selection with accent, emotion, and speed controls
2. THE Audio_System SHALL generate voice lines matching scene dialogue
3. WHEN voice lines are generated, THE Audio_System SHALL match dialogue timing within 0.3 seconds
4. THE Audio_System SHALL generate voice audio before video to set scene duration from speech length
5. THE Audio_System SHALL offer music selection by mood categories
6. THE Audio_System SHALL provide searchable sound effects library
7. THE Audio_System SHALL allow upload of custom audio files
8. THE Audio_System SHALL store voice lines separately from video to allow regeneration without redoing video
9. THE Audio_System SHALL support Nigerian English and Pidgin voice options

### Requirement 13: Subtitles

**User Story:** As a creator, I want one-click subtitle generation with styling options, so that my video is accessible and engaging.

#### Acceptance Criteria

1. WHEN a user requests subtitles, THE Subtitle_System SHALL generate subtitles from known script dialogue
2. THE Subtitle_System SHALL align subtitle timing to voice track using the script text
3. THE Subtitle_System SHALL offer style presets: Clean, Bold, Cinematic, and YouTube
4. THE Subtitle_System SHALL allow editing of subtitle text and timing
5. WHEN subtitles are generated, THE Subtitle_System SHALL align to speech on 95% or more of lines
6. THE Subtitle_System SHALL use speech-to-text (such as Scribe v3) as fallback when script alignment fails
7. THE Subtitle_System SHALL display subtitles by default in video previews

### Requirement 14: Video Export

**User Story:** As a creator, I want to export my finished video as MP4, so that I can publish or share it externally.

#### Acceptance Criteria

1. WHEN a user initiates export, THE Export_System SHALL display summary of duration, scenes, voice, music, subtitles, and resolution
2. THE Export_System SHALL offer resolution options: 720p, 1080p, and 4K (if pipeline supports)
3. WHEN export completes, THE Export_System SHALL produce a valid MP4 file
4. THE Export_System SHALL provide Download, Share, and Create Another actions
5. WHEN a 30-minute 1080p MP4 is exported, THE Export_System SHALL produce a file playable in YouTube and VLC
6. THE Export_System SHALL save exports as immutable files
7. THE Export_System SHALL use FFmpeg for concatenation, audio mixing, subtitle burn-in, and encoding

### Requirement 15: Character Consistency

**User Story:** As a storyteller, I want my characters to look recognizably the same across all scenes, so that my story is visually coherent.

#### Acceptance Criteria

1. WHEN a character is created, THE Consistency_System SHALL generate a reference kit of 2-6 approved images
2. THE Consistency_System SHALL include headshot, full body, and turnaround poses in reference kit
3. WHEN a scene job starts, THE Consistency_System SHALL attach the locked reference kit to the provider request
4. THE Consistency_System SHALL require reference kit approval before any scene generation begins
5. IF a user regenerates a character's reference, THE Consistency_System SHALL create a new version without deleting the old
6. THE Consistency_System SHALL track character consistency rating through user thumbs-up on scenes
7. THE Consistency_System SHALL target 70% or higher user thumbs-up rating for character consistency

### Requirement 16: State Preservation and Recovery

**User Story:** As a creator, I want my work preserved even if I leave mid-generation or encounter failures, so that I never lose my progress.

#### Acceptance Criteria

1. THE State_System SHALL persist every script, character, and completed scene across all failures
2. WHEN a user returns after leaving mid-generation, THE State_System SHALL restore exact project state
3. THE State_System SHALL maintain 100% state preservation for project resume rate
4. WHEN a provider fails, THE State_System SHALL preserve all previously completed work
5. THE State_System SHALL store every edit as a new version with timestamp
6. THE State_System SHALL allow recovery to any previous version
7. IF a take fails, THE State_System SHALL preserve all other takes for that scene

### Requirement 17: Provider Independence

**User Story:** As a developer, I want AI models swappable through configuration, so that model churn does not require code rewrites.

#### Acceptance Criteria

1. THE Provider_Layer SHALL expose interfaces for VideoProvider, ImageProvider, VoiceProvider, MusicProvider, and LLMProvider
2. THE Provider_Layer SHALL hide vendor names from the UI and workflow code
3. WHEN a provider is changed, THE Provider_Layer SHALL swap models through configuration without code changes
4. THE Provider_Layer SHALL maintain a registry of models with capabilities (max clip seconds, aspect ratios, reference limits, price per second)
5. THE Provider_Layer SHALL return standardized job result shape: status, outputURL, billedCost, providerJobId, errorClass
6. WHEN a provider retires a model, THE Provider_Layer SHALL switch to the configured fallback automatically
7. THE Provider_Layer SHALL store model ID, version date, full parameters, input asset IDs, prompt text, and seed for job replay

### Requirement 18: Credits and Billing

**User Story:** As a user, I want to purchase and track credits for video generation, so that I can control my spending.

#### Acceptance Criteria

1. THE Credit_System SHALL display credit balance prominently in the dashboard
2. WHEN a user initiates generation, THE Credit_System SHALL display credit cost before the action
3. THE Credit_System SHALL reserve credits when a scene is queued
4. WHEN a take completes successfully, THE Credit_System SHALL charge credits
5. WHEN a take fails or is blocked by moderation, THE Credit_System SHALL refund reserved credits automatically
6. THE Credit_System SHALL maintain an append-only ledger with delta, reason, project ID, provider cost, and timestamp
7. THE Credit_System SHALL support payment through Paystack or Flutterwave for Nigeria and Stripe for international
8. THE Credit_System SHALL price credits at no less than 2 times measured cost after payment fees and expected retries
9. THE Credit_System SHALL display estimated total credits before queue starts

### Requirement 19: Content Moderation and Safety

**User Story:** As a platform operator, I want to prevent harmful content generation, so that AKUKO operates safely and legally.

#### Acceptance Criteria

1. WHEN a prompt is submitted, THE Moderation_System SHALL validate against content rules before sending to provider
2. THE Moderation_System SHALL reject photorealistic depictions of real people
3. IF a prompt is rejected by moderation, THE Moderation_System SHALL mark the scene as blocked with explanation
4. THE Moderation_System SHALL allow the user to edit the prompt after rejection
5. WHEN a provider safety filter rejects content, THE Moderation_System SHALL mark the scene as blocked without retry
6. THE Moderation_System SHALL log all moderation decisions with reason codes

### Requirement 20: Abuse Prevention

**User Story:** As a platform operator, I want to prevent abuse of free credits, so that the platform remains sustainable.

#### Acceptance Criteria

1. THE Abuse_System SHALL require verified email plus phone or Google sign-in
2. THE Abuse_System SHALL block disposable email domains
3. THE Abuse_System SHALL implement Cloudflare Turnstile on sign-up and first generation
4. THE Abuse_System SHALL enforce per-account, per-device, and per-IP daily limits
5. THE Abuse_System SHALL implement a global daily spend cap with admin kill switch
6. THE Abuse_System SHALL log all abuse prevention actions for audit

### Requirement 21: Storyboard Mode (Free Tier)

**User Story:** As a new user, I want to create videos for free with limited features, so that I can try AKUKO before purchasing credits.

#### Acceptance Criteria

1. WHEN a free user generates video, THE Storyboard_System SHALL produce AI stills with slow camera motion instead of video
2. THE Storyboard_System SHALL include voice, music, and subtitles in free outputs
3. THE Storyboard_System SHALL output at 720p resolution with watermark
4. THE Storyboard_System SHALL cap free generation at approximately 5 minutes per month
5. THE Storyboard_System SHALL target production cost under $3 per active free user per month

### Requirement 22: Performance Requirements

**User Story:** As a user, I want responsive performance, so that I can work efficiently without waiting.

#### Acceptance Criteria

1. WHEN an authenticated user loads the dashboard, THE Performance_System SHALL render within 2 seconds on mid-range phone over 4G
2. WHEN scene status changes in database, THE Performance_System SHALL update the browser within 3 seconds
3. THE Performance_System SHALL support 100 concurrent projects in Phase 1 without code changes
4. THE Performance_System SHALL use low-resolution preview proxies (360p) for scrubbing in the editor
5. THE Performance_System SHALL implement lazy-loaded thumbnails and data-saver toggle for mobile users
6. THE Performance_System SHALL support resumable uploads for reference images and audio

### Requirement 23: Accessibility Requirements

**User Story:** As a user with disabilities, I want accessible interfaces, so that I can use AKUKO effectively.

#### Acceptance Criteria

1. THE Accessibility_System SHALL support keyboard navigation for scene list and timeline
2. THE Accessibility_System SHALL provide live-region announcements for progress and errors
3. THE Accessibility_System SHALL maintain contrast ratio of at least 4.5:1 for text
4. THE Accessibility_System SHALL support reduced-motion preferences
5. THE Accessibility_System SHALL display subtitles on by default in previews
6. THE Accessibility_System SHALL follow WCAG 2.1 Level AA guidelines

### Requirement 24: Device Support

**User Story:** As a mobile user, I want to create and monitor projects on my phone, so that I can work from anywhere.

#### Acceptance Criteria

1. WHEN a user accesses AKUKO on desktop (1024px and up), THE Device_System SHALL provide full studio and timeline editing
2. WHEN a user accesses AKUKO on tablet (768-1023px), THE Device_System SHALL provide collapsible navigation with side panels as tabs
3. WHEN a user accesses AKUKO on mobile (under 768px), THE Device_System SHALL provide create, script, character creation, monitoring, and preview functions
4. THE Device_System SHALL display read-only timeline strip on mobile with "Open on desktop" prompt for full editing
5. THE Device_System SHALL target dashboard interactive in under 2 seconds on mid-range phone over 4G

### Requirement 25: Observability and Monitoring

**User Story:** As a platform operator, I want visibility into system behavior, so that I can detect and resolve issues.

#### Acceptance Criteria

1. THE Observability_System SHALL capture all errors through Sentry
2. THE Observability_System SHALL track product analytics through PostHog
3. THE Observability_System SHALL record OpenTelemetry traces for job execution
4. THE Observability_System SHALL display job dashboard in admin area
5. THE Observability_System SHALL log every failed scene with its cost
6. THE Observability_System SHALL record provider call details: provider, endpoint, request ID, charge, latency, outcome

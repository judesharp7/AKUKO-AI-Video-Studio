# Implementation Plan: AKUKO AI Video Studio

## Overview

This implementation plan covers building the AKUKO AI Video Studio platform from scratch, following the requirements-first workflow. The platform enables users to create long-form videos (30+ minutes) from story ideas using orchestrated AI models for video generation, voice synthesis, music, and assembly.

The implementation follows a phased approach:
- **Phase 1: Core Workflow (Weeks 1-14)** - Foundation, core features, editor, credits
- **Phase 2: Audio & Polish (Weeks 15-22)** - Advanced audio, optimization
- **Phase 3: Advanced Features (Week 23+)** - Templates, collaboration, publishing

---

## Tasks

### 1. Project Setup and Infrastructure (Week 1-2)

- [ ] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
  - Create Next.js 14+ project with App Router
  - Configure TypeScript 5+ with strict mode
  - Set up Tailwind CSS with custom design tokens
  - Install and configure shadcn/ui component library
  - Set up ESLint and Prettier configurations
  - _Requirements: 22.1, 24.1_

- [ ] 1.2 Set up Supabase project and database schema
  - Create Supabase project
  - Run database migrations for all tables (users, projects, characters, scenes, takes, assets, etc.)
  - Configure Row-Level Security (RLS) policies for all user-scoped tables
  - Set up database indexes for performance
  - Create database backup configuration
  - _Requirements: 1.1, 16.1_

- [ ] 1.3 Configure Supabase Authentication
  - Enable email/password authentication
  - Enable Google OAuth provider
  - Configure email verification requirement
  - Set up disposable email domain blocking
  - Create auth helpers and hooks for client/server
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.4 Set up Cloudflare R2 storage
  - Create R2 bucket for video, audio, and image assets
  - Configure CORS policies for direct browser uploads
  - Implement signed URL generation for uploads and downloads
  - Set up lifecycle rules for temporary file cleanup
  - _Requirements: 8.7, 22.6_

- [ ] 1.5 Create provider layer interfaces and types
  - Define VideoProvider interface with submitJob, checkStatus, cancelJob methods
  - Define ImageProvider interface with generateImage, generateVariations methods
  - Define VoiceProvider interface with synthesize, cloneVoice, getVoices methods
  - Define MusicProvider interface with generateMusic, searchLibrary methods
  - Define LLMProvider interface with generateStructured, generateText methods
  - Create TypeScript types for all request/response shapes
  - _Requirements: 17.1, 17.5_

- [ ] 1.6 Implement Model Registry
  - Create ModelRegistry class with model capability tracking
  - Define VideoModelInfo, ImageModelInfo, VoiceModelInfo types
  - Implement getVideoModels, getImageModels, getVoiceModels, getMusicModels methods
  - Implement getDefaultModel selection by tier (draft/standard/premium)
  - Add model availability tracking and fallback configuration
  - _Requirements: 17.4, 17.6_

- [ ] 1.7 Set up Trigger.dev workflow engine
  - Create Trigger.dev account and project
  - Configure environment variables and secrets
  - Create base task configuration with retry policies
  - Set up webhook endpoints for provider callbacks
  - Implement logging and error tracking integration
  - _Requirements: 8.1, 8.5_

- [ ] 1.8 Configure observability tools
  - Set up Sentry for error tracking
  - Set up PostHog for product analytics
  - Configure OpenTelemetry for distributed tracing
  - Create logging utilities with structured output
  - Set up error alerting rules
  - _Requirements: 25.1, 25.2, 25.3_

- [ ] 1.9 Create GitHub repository and CI/CD pipeline
  - Initialize Git repository with .gitignore for Next.js
  - Create README with setup instructions
  - Set up GitHub Actions workflow for CI (lint, type-check, test)
  - Configure deployment workflow for staging and production
  - Set up branch protection rules for main branch
  - _Requirements: 22.1_

- [ ] 1.10 Checkpoint - Verify foundation setup
  - Ensure all infrastructure services are accessible
  - Verify database migrations applied correctly
  - Test authentication flow end-to-end
  - Confirm R2 storage upload/download works
  - Ask the user if questions arise.

---

### 2. Dashboard and Project Management (Week 3)

- [ ] 2.1 Implement landing page with authentication
  - Create landing page with product overview and CTAs
  - Add sign-in/sign-up buttons linking to Supabase Auth
  - Implement auth callback handling
  - Create protected route middleware
  - Build loading states and error handling
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.2 Build user profile and account settings
  - Create profile page showing credit balance and plan type
  - Implement account settings (email, password, preferences)
  - Add email verification status indicator
  - Build error message display with recovery options
  - _Requirements: 1.6, 1.7_

- [ ] 2.3 Create dashboard layout and navigation
  - Build main dashboard layout with sidebar navigation
  - Create navigation items: Dashboard, Library, Templates, Settings
  - Implement responsive navigation (desktop, tablet, mobile)
  - Add user menu with sign-out option
  - _Requirements: 2.6, 24.1, 24.2, 24.3_

- [ ] 2.4 Implement project list and recent projects
  - Create project list component with thumbnail, duration, scene count
  - Implement project fetching with TanStack Query
  - Add "Continue" button for each project
  - Build loading and error states
  - Optimize for < 2 second load time on 4G
  - _Requirements: 2.1, 2.3, 2.4, 22.1_

- [ ] 2.5 Build empty state and quick create
  - Create empty state component with guidance for first video
  - Add "Create New Video" primary action button
  - Implement Quick Create modal for rapid project initiation
  - Add keyboard shortcuts for power users
  - _Requirements: 2.2, 2.5, 2.7_

- [ ] 2.6 Implement project CRUD operations
  - Create project creation API endpoint
  - Implement project listing with pagination
  - Add project update and delete endpoints
  - Build project detail page
  - _Requirements: 2.4, 3.6_

- [ ]* 2.7 Write unit tests for dashboard components
  - Test project list rendering and interactions
  - Test navigation and routing
  - Test empty state display
  - _Requirements: 2.1_

- [ ] 2.8 Checkpoint - Verify dashboard functionality
  - Test all dashboard interactions end-to-end
  - Verify responsive design on all breakpoints
  - Ensure performance targets are met
  - Ask the user if questions arise.

---

### 3. Project Setup Wizard (Week 3-4)

- [ ] 3.1 Create project setup form
  - Build project name input field
  - Add video type selection (story, tutorial, advert)
  - Implement aspect ratio selector (16:9, 9:16, 1:1)
  - Create target duration input with preset options (5-60 minutes)
  - Add custom duration entry field
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.2 Implement project setup persistence
  - Save project settings on form completion
  - Generate unique project identifier
  - Initialize project status as "draft"
  - Set current_step to "setup"
  - Handle save errors gracefully
  - _Requirements: 3.5, 3.6_

- [ ] 3.3 Build project setup wizard navigation
  - Create step indicator component
  - Implement back/next navigation
  - Add progress persistence between steps
  - Handle browser navigation (back button)
  - _Requirements: 3.5_

- [ ]* 3.4 Write unit tests for project setup
  - Test form validation
  - Test aspect ratio and duration selection
  - Test project creation flow
  - _Requirements: 3.1_

---

### 4. Character Studio (Week 4-5)

- [ ] 4.1 Create character creation form
  - Build form fields: name, age, gender, appearance, clothing, personality
  - Implement form validation with helpful error messages
  - Add optional reference image upload capability
  - Create character preview component
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Implement voice selection interface
  - Build voice selection dropdown with preview
  - Add voice settings: accent, emotion, speed controls
  - Implement voice preview playback
  - Support Nigerian English and Pidgin options
  - _Requirements: 4.5, 12.9_

- [ ] 4.3 Build reference kit generation workflow
  - Create Trigger.dev task for reference kit generation
  - Generate 2-6 character reference images (headshot, full body, turnaround)
  - Implement image generation via ImageProvider
  - Store generated images in R2
  - Create asset records for generated images
  - _Requirements: 4.3, 15.1, 15.2, Property 16_

- [ ] 4.4 Implement character reference preview and approval
  - Build reference image gallery view
  - Add regenerate individual image functionality
  - Implement approve/reject workflow for each image
  - Create "Lock Character" functionality
  - _Requirements: 4.4, 4.9, 4.10, 15.4_

- [ ] 4.5 Build character library and management
  - Create character list with search and filter
  - Implement Use, Edit, Duplicate, Delete actions
  - Add character usage tracking (scene count)
  - Build character detail view
  - _Requirements: 4.6, 4.7_

- [ ] 4.6 Implement character consistency tracking
  - Add locked flag to character model
  - Track reference kit approval status
  - Implement character consistency rating (thumbs-up tracking)
  - Display consistency metrics to user
  - _Requirements: 4.10, 15.3, 15.5, 15.6, 15.7_

- [ ]* 4.7 Write property tests for character reference kit
  - **Property 16: Character Reference Kit Size** - Verify generated kits contain 2-6 images
  - **Validates: Requirements 4.3, 15.1**

- [ ]* 4.8 Write property tests for reference kit approval
  - **Property 14: Reference Kit Approval Requirement** - Verify scene generation blocked without locked references
  - **Validates: Requirements 15.4, 4.10**

- [ ]* 4.9 Write unit tests for character studio
  - Test character creation and validation
  - Test voice selection settings
  - Test character locking behavior
  - _Requirements: 4.1_

- [ ] 4.10 Checkpoint - Verify character studio functionality
  - Test character creation end-to-end
  - Verify reference kit generation works
  - Ensure voice preview functions correctly
  - Ask the user if questions arise.

---

### 5. Story and Script Generation (Week 5-6)

- [ ] 5.1 Create story input interface
  - Build plain-language story idea input field
  - Add example prompts and guidance
  - Implement character limit and validation
  - Create story generation trigger button
  - _Requirements: 5.1_

- [ ] 5.2 Implement story generation with LLM
  - Create Trigger.dev task for story generation
  - Define structured JSON schema for story output (title, summary, characters, conflict, events, climax, ending)
  - Implement LLMProvider integration for structured output
  - Add Zod schema validation for JSON response
  - Implement automatic repair for invalid JSON
  - _Requirements: 5.1, 5.2, 5.3, Property 7_

- [ ] 5.3 Build story display and editing
  - Create story display component with all sections
  - Implement inline editing for story content
  - Add version tracking for story changes
  - Build approve/regenerate workflow
  - _Requirements: 5.5_

- [ ] 5.4 Implement script generation
  - Create Trigger.dev task for script generation
  - Parse approved story into full script with dialogue and scene descriptions
  - Implement structured output with scene breakdown
  - Validate script against defined schema
  - _Requirements: 5.4_

- [ ] 5.5 Build script editor
  - Create script display with scene-by-scene breakdown
  - Implement rich text editing for script content
  - Add version history tracking
  - Build auto-save functionality
  - Create edit persistence to scene planning
  - _Requirements: 5.5, 5.6, 5.7, 5.8_

- [ ]* 5.6 Write property tests for JSON schema validation
  - **Property 7: JSON Schema Validation** - Verify all LLM structured outputs validate against Zod schemas
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 5.7 Write unit tests for story generation
  - Test story input validation
  - Test JSON parsing and validation
  - Test auto-repair functionality
  - _Requirements: 5.1_

- [ ] 5.8 Checkpoint - Verify story and script generation
  - Test complete story generation flow
  - Verify script editing and saving
  - Ensure version tracking works
  - Ask the user if questions arise.

---

### 6. Scene Builder (Week 6-7)

- [ ] 6.1 Implement script parsing and scene creation
  - Create script parser to extract scene information
  - Generate approximately 90 scenes for 30-minute video
  - Parse: duration, location, characters, action, dialogue, camera, mood
  - Validate parsing completes within 2 minutes for 30-minute script
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6.2 Build scene list component
  - Create virtualized scene list (react-window) for 90-225 scenes
  - Display scene summary: position, duration, location, characters
  - Implement scene selection and detail view
  - Add scene status indicators
  - _Requirements: 6.3, 9.5_

- [ ] 6.3 Implement scene editing interface
  - Build scene detail editor with all fields
  - Implement duration input with model limit validation
  - Add location and character selection
  - Create visual prompt editor
  - _Requirements: 6.3, 6.7, Property 11_

- [ ] 6.4 Build scene drag-and-drop reordering
  - Implement drag-and-drop using sortable position keys
  - Update scene positions without rewriting all rows
  - Maintain unique positions after reorder
  - Calculate and display total estimated duration
  - _Requirements: 6.4, 6.8, 6.9, Property 6_

- [ ] 6.5 Implement scene CRUD operations
  - Add create, duplicate, delete actions
  - Implement "Add scene at position" functionality
  - Build scene deletion confirmation
  - Handle cascade effects on positions
  - _Requirements: 6.5, 6.6_

- [ ] 6.6 Build scene duration validation
  - Fetch model limits from Model Registry
  - Validate scene duration against selected video model's max clip length
  - Display validation errors for invalid durations
  - Suggest valid duration range
  - _Requirements: 6.7, Property 11_

- [ ]* 6.7 Write property tests for scene position integrity
  - **Property 6: Scene Position Integrity After Reorder** - Verify positions remain unique and sortable
  - **Validates: Requirements 6.9**

- [ ]* 6.8 Write property tests for scene duration validation
  - **Property 11: Scene Duration Validation** - Verify durations validated against model limits
  - **Validates: Requirements 6.7**

- [ ]* 6.9 Write unit tests for scene builder
  - Test scene creation and editing
  - Test drag-and-drop reordering
  - Test duration validation
  - _Requirements: 6.1_

- [ ] 6.10 Checkpoint - Verify scene builder functionality
  - Test scene parsing from script
  - Verify drag-and-drop works correctly
  - Ensure duration validation functions
  - Ask the user if questions arise.

---

### 7. Prompt Assistant (Week 7)

- [ ] 7.1 Create prompt expansion interface
  - Build prompt input with simple text entry
  - Implement side-by-side view: user text vs AI-expanded prompt
  - Add Accept, Edit, Regenerate action buttons
  - Create prompt preview component
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7.2 Implement prompt expansion with LLM
  - Create LLMProvider task for prompt expansion
  - Incorporate character references into expansion
  - Include location details and style bible
  - Generate production-quality prompts
  - _Requirements: 7.1, 7.5_

- [ ] 7.3 Build prompt content moderation
  - Implement content moderation before provider submission
  - Reject photorealistic depictions of real people
  - Return moderation result with reason codes
  - Block prompts that fail moderation with explanation
  - _Requirements: 7.6, 19.1, 19.2, Property 17_

- [ ] 7.4 Implement prompt association with scenes
  - Store expanded prompt with scene record
  - Track prompt edit history
  - Handle prompt regeneration
  - _Requirements: 7.4_

- [ ]* 7.5 Write property tests for moderation gate
  - **Property 17: Moderation Gate** - Verify moderation occurs before AI provider calls
  - **Validates: Requirements 19.1, 19.2**

- [ ]* 7.6 Write unit tests for prompt assistant
  - Test prompt expansion logic
  - Test moderation rules
  - Test prompt association
  - _Requirements: 7.1_

---

### 8. Long-Form Generation Pipeline (Week 8-9)

- [ ] 8.1 Create generation pipeline orchestrator
  - Build Trigger.dev workflow for generation pipeline
  - Implement job queue management
  - Set up job dependencies (voice → video)
  - Configure concurrency limits per provider
  - _Requirements: 8.1, 8.6_

- [ ] 8.2 Implement scene job execution
  - Create scene generation task with idempotency
  - Validate inputs before provider submission
  - Submit to VideoProvider with reference kit
  - Handle provider callbacks (webhooks) and polling fallback
  - Copy output to R2 immediately on completion
  - _Requirements: 8.7, 8.10, 10.1, Property 2_

- [ ] 8.3 Build job status tracking
  - Implement scene status updates: draft → ready → queued → generating → complete → approved
  - Track job progress in database
  - Update via Supabase Realtime
  - Display progress as "X of Y scenes" and "MM:SS of HH:MM"
  - _Requirements: 8.2, 8.3, Property 1_

- [ ] 8.4 Implement state preservation and recovery
  - Checkpoint workflow state at each step
  - Persist all completed work across failures
  - Enable resumption after browser close
  - Handle provider outages gracefully
  - _Requirements: 8.4, 8.5, 16.1, 16.2, 16.3, 16.4, Property 5_

- [ ] 8.5 Build adjacent scene keyframe handling
  - Detect adjacent scenes sharing location
  - Use last frame of first scene as start frame for next
  - Implement frame extraction from completed clips
  - _Requirements: 8.9_

- [ ] 8.6 Implement webhook handling and de-duplication
  - Create webhook endpoint for provider callbacks
  - De-duplicate by provider request ID
  - Handle multiple delivery scenarios
  - Log all webhook events
  - _Requirements: 8.11, 10.5, Property 3_

- [ ] 8.7 Build polling fallback for webhooks
  - Implement polling every 5-10 seconds
  - Check job status via provider API
  - Handle cases where webhook fails
  - Update scene status from poll results
  - _Requirements: 10.6_

- [ ]* 8.8 Write property tests for idempotent job submission
  - **Property 2: Idempotent Job Submission** - Verify same idempotency key creates one job
  - **Validates: Requirements 8.10**

- [ ]* 8.9 Write property tests for webhook de-duplication
  - **Property 3: Webhook De-duplication** - Verify multiple deliveries result in one update
  - **Validates: Requirements 8.11, 10.5**

- [ ]* 8.10 Write property tests for state preservation
  - **Property 5: State Preservation Across Failures** - Verify completed work survives failures
  - **Validates: Requirements 16.1, 16.4, 8.4**

- [ ]* 8.11 Write property tests for R2 copy completeness
  - **Property 9: R2 Copy Completeness** - Verify output copied before status update
  - **Validates: Requirements 8.7**

- [ ]* 8.12 Write unit tests for generation pipeline
  - Test job queue management
  - Test status transitions
  - Test webhook handling
  - _Requirements: 8.1_

- [ ] 8.13 Checkpoint - Verify generation pipeline
  - Test complete generation workflow
  - Verify state preservation
  - Ensure webhook handling works
  - Ask the user if questions arise.

---

### 9. Generation Screen (Week 9-10)

- [ ] 9.1 Create generation screen layout
  - Build three-panel layout: scene list (left), preview (center), settings (right)
  - Implement responsive design for different screen sizes
  - Add generation controls and status display
  - _Requirements: 9.1, 9.6_

- [ ] 9.2 Build scene list with status tracking
  - Create virtualized scene list for performance
  - Display status: Generating, Waiting, Complete, Failed
  - Add "Generate Scene" button for individual control
  - Implement scene selection for preview
  - _Requirements: 9.2, 9.5_

- [ ] 9.3 Implement real-time status updates
  - Set up Supabase Realtime subscription for scene updates
  - Update browser within 3 seconds of database change
  - Handle connection loss and reconnection
  - Display connection status indicator
  - _Requirements: 9.4, Property 18_

- [ ] 9.4 Build generation progress display
  - Show descriptive progress text (never just "Loading")
  - Display "Creating Scene 08 of 90" format
  - Add elapsed time and estimated remaining
  - Implement progress bar visualization
  - _Requirements: 9.3_

- [ ] 9.5 Implement scene preview on completion
  - Auto-display preview when scene completes
  - Build video player component
  - Add playback controls
  - Support multiple preview formats
  - _Requirements: 9.7_

- [ ] 9.6 Build scene settings panel
  - Display character, location, duration settings
  - Show style, camera, aspect ratio options
  - Allow in-place editing of settings
  - Implement setting changes mid-generation
  - _Requirements: 9.6_

- [ ]* 9.7 Write property tests for real-time update latency
  - **Property 18: Real-time Status Update Latency** - Verify updates reach browser within 3 seconds
  - **Validates: Requirements 22.2, 9.4**

- [ ]* 9.8 Write unit tests for generation screen
  - Test scene list rendering
  - Test real-time subscription handling
  - Test preview functionality
  - _Requirements: 9.1_

- [ ] 9.9 Checkpoint - Verify generation screen
  - Test real-time updates end-to-end
  - Verify preview functionality
  - Ensure progress display works
  - Ask the user if questions arise.

---

### 10. Scene Job Execution (Week 10)

- [ ] 10.1 Implement scene job validation
  - Validate scene inputs before provider submission
  - Check reference kit approval status
  - Verify credit availability
  - Validate prompt content
  - _Requirements: 10.1, Property 14_

- [ ] 10.2 Build retry logic with exponential backoff
  - Implement retry for network errors and 5xx responses
  - Configure exponential backoff: 2s, 4s, 8s initial delays
  - Maximum 3 retry attempts
  - No retry for 4xx validation errors
  - _Requirements: 10.2, 10.3, Property 13_

- [ ] 10.3 Implement fallback model handling
  - Query Model Registry for fallback models
  - Attempt next model on failure (if user allows)
  - Track model attempts in take record
  - Log fallback events
  - _Requirements: 10.4_

- [ ] 10.4 Build job isolation for failures
  - Ensure failed scene stops only itself
  - Allow queue to continue processing
  - Preserve failed scene prompts
  - Enable "Edit Prompt" action after failure
  - _Requirements: 10.8, 10.9, Property 12_

- [ ] 10.5 Implement credit billing for jobs
  - Log billed charge for every job attempt
  - Track provider costs
  - Update credit ledger
  - Handle refunds for failures
  - _Requirements: 10.7, 18.4, 18.5_

- [ ]* 10.6 Write property tests for generation job isolation
  - **Property 12: Generation Job Isolation** - Verify only failed scene stops
  - **Validates: Requirements 10.8, 8.5**

- [ ]* 10.7 Write property tests for retry policy
  - **Property 13: Retry Policy Correctness** - Verify retry behavior matches policy
  - **Validates: Requirements 10.2, 10.3**

- [ ]* 10.8 Write unit tests for scene job execution
  - Test validation logic
  - Test retry behavior
  - Test failure handling
  - _Requirements: 10.1_

---

### 11. Video Editor (Week 11-12)

- [ ] 11.1 Create video editor layout
  - Build three-section layout: preview (top), assets (left), timeline (bottom)
  - Implement responsive design
  - Add keyboard navigation support
  - Create accessible interface components
  - _Requirements: 11.1, 11.9, 23.1_

- [ ] 11.2 Build timeline component
  - Create multi-track timeline (Video, Voice, Music)
  - Display scenes as clips with duration visualization
  - Implement timeline zoom and scroll
  - Add timecode display
  - _Requirements: 11.2_

- [ ] 11.3 Implement clip editing operations
  - Add trim, split, reorder, delete actions
  - Implement duplicate and replace functionality
  - Build regenerate action for scenes
  - Handle edits without page reload
  - _Requirements: 11.3, 11.5_

- [ ] 11.4 Build transitions between scenes
  - Create transition selection interface
  - Support fade, dissolve, cut transitions
  - Preview transitions in timeline
  - Store transitions in edit decision list
  - _Requirements: 11.4_

- [ ] 11.5 Implement auto-save and undo/redo
  - Auto-save timeline after 2 seconds of inactivity
  - Build command history for undo/redo
  - Implement keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - Track save status indicator
  - _Requirements: 11.6, 11.7_

- [ ] 11.6 Build timeline as edit decision list
  - Store timeline as JSON structure
  - Include clips, transitions, audio tracks
  - Support version history
  - Enable timeline export
  - _Requirements: 11.8_

- [ ] 11.7 Implement preview proxy system
  - Generate low-resolution (360p) preview proxies
  - Use proxies for scrubbing performance
  - Support proxy regeneration on edit
  - Handle missing proxies gracefully
  - _Requirements: 11.10, 22.4_

- [ ]* 11.8 Write unit tests for video editor
  - Test timeline operations
  - Test auto-save functionality
  - Test undo/redo behavior
  - _Requirements: 11.1_

- [ ] 11.9 Checkpoint - Verify video editor functionality
  - Test timeline editing end-to-end
  - Verify auto-save works
  - Ensure preview playback functions
  - Ask the user if questions arise.

---

### 12. Voice, Music, and Sound Effects (Week 12)

- [ ] 12.1 Implement voice synthesis integration
  - Create VoiceProvider adapter for ElevenLabs
  - Build voice synthesis task in Trigger.dev
  - Support voice settings: speed, stability, similarity, style
  - Generate voice lines matching scene dialogue
  - _Requirements: 12.1, 12.2_

- [ ] 12.2 Build voice-first generation workflow
  - Generate voice audio before video
  - Measure voice duration accurately
  - Set scene duration from speech length
  - Ensure timing match within 0.3 seconds
  - _Requirements: 12.3, 12.4, Property 10_

- [ ] 12.3 Implement music selection and generation
  - Create music library with mood categories
  - Build music generation via MusicProvider
  - Support custom music upload
  - Implement music search functionality
  - _Requirements: 12.5_

- [ ] 12.4 Build sound effects library
  - Create searchable SFX library interface
  - Support custom audio upload
  - Implement SFX placement in timeline
  - Add volume and timing controls
  - _Requirements: 12.6, 12.7_

- [ ] 12.5 Implement audio storage and management
  - Store voice lines separately from video
  - Enable voice regeneration without video redo
  - Track audio assets in database
  - Support audio format conversions
  - _Requirements: 12.8_

- [ ]* 12.6 Write property tests for voice-scene duration alignment
  - **Property 10: Voice-Scene Duration Alignment** - Verify scene duration set from speech length
  - **Validates: Requirements 12.3, 12.4**

- [ ]* 12.7 Write unit tests for audio integration
  - Test voice synthesis
  - Test music selection
  - Test audio timing
  - _Requirements: 12.1_

---

### 13. Subtitles (Week 12)

- [ ] 13.1 Implement subtitle generation from script
  - Generate subtitles from known script dialogue
  - Align subtitle timing to voice track
  - Support script-based text alignment
  - Handle timing adjustments
  - _Requirements: 13.1, 13.2_

- [ ] 13.2 Build subtitle styling system
  - Create style presets: Clean, Bold, Cinematic, YouTube
  - Allow custom style adjustments
  - Preview styles on video
  - Store style preferences
  - _Requirements: 13.3_

- [ ] 13.3 Implement subtitle editing interface
  - Build subtitle cue editor
  - Allow text and timing edits
  - Support cue addition and deletion
  - Implement subtitle preview
  - _Requirements: 13.4_

- [ ] 13.4 Build subtitle alignment verification
  - Verify 95%+ alignment to speech
  - Implement speech-to-text fallback (Scribe v3)
  - Display alignment accuracy metrics
  - Handle alignment failures
  - _Requirements: 13.5, 13.6_

- [ ] 13.5 Implement subtitle display in previews
  - Display subtitles by default in previews
  - Support subtitle toggle
  - Apply selected style to preview
  - _Requirements: 13.7_

- [ ]* 13.6 Write unit tests for subtitle system
  - Test subtitle generation
  - Test alignment accuracy
  - Test styling options
  - _Requirements: 13.1_

---

### 14. Video Export (Week 13)

- [ ] 14.1 Create export summary and options
  - Display export summary: duration, scenes, voice, music, subtitles
  - Offer resolution options: 720p, 1080p, 4K
  - Show estimated file size
  - Add export initiation controls
  - _Requirements: 14.1, 14.2_

- [ ] 14.2 Implement FFmpeg render pipeline
  - Set up FFmpeg worker container (CloudRun/Fly.io)
  - Implement scene concatenation
  - Build audio mixing (voice, music, SFX)
  - Implement subtitle burn-in
  - Encode to MP4 (H.264/AAC)
  - _Requirements: 14.7_

- [ ] 14.3 Build export task execution
  - Create Trigger.dev export task
  - Process timeline JSON as edit decision list
  - Handle export progress tracking
  - Store exports as immutable files in R2
  - _Requirements: 14.6_

- [ ] 14.4 Implement export completion and download
  - Produce valid MP4 playable in YouTube and VLC
  - Provide Download, Share, Create Another actions
  - Generate signed download URLs
  - Track export history
  - _Requirements: 14.3, 14.4, 14.5_

- [ ]* 14.5 Write unit tests for export pipeline
  - Test FFmpeg commands
  - Test export task execution
  - Test file format validation
  - _Requirements: 14.3_

- [ ] 14.6 Checkpoint - Verify export functionality
  - Test complete export workflow
  - Verify MP4 plays correctly
  - Ensure download works
  - Ask the user if questions arise.

---

### 15. Credits and Billing (Week 13-14)

- [ ] 15.1 Implement credit system core
  - Create credit balance tracking in user record
  - Build append-only credit ledger (delta, reason, project_id, provider_cost)
  - Implement credit reservation for queued scenes
  - Charge credits on successful take completion
  - Refund credits on failure or moderation block
  - _Requirements: 18.1, 18.3, 18.4, 18.5, Property 4, Property 15_

- [ ] 15.2 Build credit display and estimation
  - Display credit balance prominently in dashboard
  - Show credit cost before generation action
  - Display estimated total credits before queue starts
  - Add credit usage history view
  - _Requirements: 18.1, 18.2, 18.9_

- [ ] 15.3 Implement payment integration (Paystack/Flutterwave)
  - Create Paystack integration for Nigeria
  - Create Flutterwave as alternative for Nigeria
  - Handle payment webhooks
  - Update credit balance on successful payment
  - _Requirements: 18.7_

- [ ] 15.4 Implement payment integration (Stripe)
  - Create Stripe integration for international users
  - Handle Stripe webhooks
  - Support multiple currencies
  - Update credit balance on successful payment
  - _Requirements: 18.7_

- [ ] 15.5 Build credit pricing controls
  - Price credits at minimum 2x measured cost (after fees and retries)
  - Implement tiered pricing by model quality
  - Track provider costs per job
  - Display cost breakdown to users
  - _Requirements: 18.8_

- [ ]* 15.6 Write property tests for credit ledger atomicity
  - **Property 4: Credit Ledger Atomicity** - Verify sum of deltas equals balance
  - **Validates: Requirements 18.6**

- [ ]* 15.7 Write property tests for credit refund on failure
  - **Property 15: Credit Refund on Failure** - Verify automatic refund on failure/block
  - **Validates: Requirements 18.5**

- [ ]* 15.8 Write unit tests for credit system
  - Test credit reservation and charging
  - Test refund logic
  - Test payment integration
  - _Requirements: 18.1_

- [ ] 15.9 Checkpoint - Verify credits and billing
  - Test complete payment flow
  - Verify credit tracking works
  - Ensure refunds process correctly
  - Ask the user if questions arise.

---

### 16. Content Moderation and Safety (Week 14)

- [ ] 16.1 Implement content moderation system
  - Build moderation check before provider submission
  - Reject photorealistic depictions of real people
  - Return moderation result with category and reason
  - Mark blocked scenes with explanation
  - _Requirements: 19.1, 19.2, 19.3, 19.4, Property 17_

- [ ] 16.2 Build provider safety filter handling
  - Handle provider safety filter rejections
  - Mark scene as blocked without retry
  - Allow prompt editing after rejection
  - Log moderation decisions with reason codes
  - _Requirements: 19.5, 19.6_

- [ ] 16.3 Implement abuse prevention controls
  - Require verified email plus phone or Google sign-in
  - Block disposable email domains at registration
  - Implement Cloudflare Turnstile on sign-up and first generation
  - Enforce per-account, per-device, per-IP daily limits
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 16.4 Build global spend controls
  - Implement global daily spend cap
  - Create admin kill switch for emergency shutdown
  - Log all abuse prevention actions
  - Build admin dashboard for monitoring
  - _Requirements: 20.5, 20.6_

- [ ]* 16.5 Write property tests for email domain validation
  - **Property 19: Email Domain Validation** - Verify disposable domains rejected
  - **Validates: Requirements 1.5**

- [ ]* 16.6 Write property tests for generation access control
  - **Property 20: Generation Access Control** - Verify unverified users blocked
  - **Validates: Requirements 1.4**

- [ ]* 16.7 Write unit tests for moderation system
  - Test moderation rules
  - Test safety filter handling
  - Test abuse prevention
  - _Requirements: 19.1_

---

### 17. Storyboard Mode (Free Tier) (Week 14)

- [ ] 17.1 Implement storyboard mode generation
  - Produce AI stills with slow camera motion instead of video
  - Include voice, music, subtitles in outputs
  - Output at 720p resolution with watermark
  - Use cheaper image models for cost efficiency
  - _Requirements: 21.1, 21.2, 21.3_

- [ ] 17.2 Build free tier limits
  - Cap free generation at approximately 5 minutes per month
  - Track free tier usage
  - Display remaining free minutes
  - Prompt upgrade when limit reached
  - _Requirements: 21.4_

- [ ] 17.3 Implement cost control for free tier
  - Target production cost under $3 per active free user per month
  - Monitor free tier costs
  - Implement usage throttling
  - _Requirements: 21.5_

- [ ]* 17.4 Write unit tests for storyboard mode
  - Test stills generation
  - Test free tier limits
  - Test watermark application
  - _Requirements: 21.1_

---

### 18. Accessibility Implementation (Week 15)

- [ ] 18.1 Implement keyboard navigation
  - Support keyboard navigation for scene list
  - Support keyboard navigation for timeline
  - Implement focus management
  - Add skip navigation links
  - _Requirements: 23.1_

- [ ] 18.2 Build live-region announcements
  - Implement ARIA live regions for progress updates
  - Announce errors to screen readers
  - Provide status change notifications
  - _Requirements: 23.2_

- [ ] 18.3 Implement visual accessibility
  - Ensure contrast ratio of at least 4.5:1 for text
  - Support reduced-motion preferences
  - Provide focus indicators
  - Implement scalable text
  - _Requirements: 23.3, 23.4_

- [ ] 18.4 Build subtitle accessibility
  - Display subtitles on by default in previews
  - Ensure subtitle styling meets readability standards
  - Support subtitle customization
  - _Requirements: 23.5_

- [ ]* 18.5 Write accessibility tests
  - Test keyboard navigation
  - Test screen reader compatibility
  - Test color contrast
  - _Requirements: 23.6_

---

### 19. Performance Optimization (Week 15-16)

- [ ] 19.1 Implement frontend performance optimizations
  - Use virtualized lists (react-window) for 90-225 scenes
  - Implement lazy-loaded thumbnails with Intersection Observer
  - Add data-saver toggle for mobile users
  - Optimize bundle size with code splitting
  - _Requirements: 9.5, 22.4, 22.5_

- [ ] 19.2 Build preview proxy system
  - Generate low-resolution (360p) preview proxies
  - Use proxies for scrubbing performance
  - Implement proxy caching
  - Support proxy regeneration
  - _Requirements: 11.10, 22.4_

- [ ] 19.3 Implement resumable uploads
  - Support chunked uploads with resume capability
  - Handle upload interruption gracefully
  - Track upload progress
  - _Requirements: 22.6_

- [ ] 19.4 Optimize real-time performance
  - Ensure dashboard interactive within 2 seconds on 4G
  - Target < 3 seconds for browser status updates
  - Implement optimistic UI updates
  - Configure database connection pooling
  - _Requirements: 22.1, 22.2, 22.3_

- [ ]* 19.5 Write performance tests
  - Test load times on various devices
  - Test real-time update latency
  - Test concurrent user handling
  - _Requirements: 22.1_

---

### 20. Mobile Responsiveness (Week 16)

- [ ] 20.1 Implement desktop layout (1024px+)
  - Provide full studio and timeline editing
  - Display all panels and controls
  - Support multi-column layouts
  - _Requirements: 24.1_

- [ ] 20.2 Build tablet layout (768-1023px)
  - Implement collapsible navigation
  - Display side panels as tabs
  - Optimize touch interactions
  - _Requirements: 24.2_

- [ ] 20.3 Implement mobile layout (under 768px)
  - Provide create, script, character creation functions
  - Support monitoring and preview
  - Display read-only timeline strip
  - Show "Open on desktop" prompt for full editing
  - _Requirements: 24.3, 24.4_

- [ ] 20.4 Optimize mobile performance
  - Target dashboard interactive within 2 seconds on mid-range phone over 4G
  - Implement touch-friendly controls
  - Optimize images for mobile
  - _Requirements: 24.5_

- [ ]* 20.5 Write responsive design tests
  - Test all breakpoints
  - Test touch interactions
  - Test mobile performance
  - _Requirements: 24.1_

---

### 21. Advanced Voice Features (Week 17-18)

- [ ] 21.1 Implement advanced voice settings
  - Build detailed voice customization UI
  - Support accent and emotion controls
  - Implement voice cloning for custom voices
  - Add voice preview with sample text
  - _Requirements: 4.5, 12.1_

- [ ] 21.2 Build voice library management
  - Create voice library with filtering
  - Support favorite voices
  - Track recently used voices
  - Display voice metadata (language, accent, gender)
  - _Requirements: 12.1_

- [ ] 21.3 Implement Nigerian voice support
  - Add Nigerian English voice options
  - Support Pidgin voice options
  - Test voice quality for local accents
  - _Requirements: 12.9_

- [ ]* 21.4 Write unit tests for advanced voice features
  - Test voice settings
  - Test voice cloning
  - Test voice library
  - _Requirements: 12.1_

---

### 22. Music and SFX Library (Week 18)

- [ ] 22.1 Build music library integration
  - Integrate with Eleven Music and Stable Audio
  - Create music browsing interface
  - Implement mood-based categorization
  - Support music preview playback
  - _Requirements: 12.5_

- [ ] 22.2 Implement music generation
  - Create Trigger.dev task for music generation
  - Support duration and mood parameters
  - Store generated music in R2
  - Handle generation failures gracefully
  - _Requirements: 12.5_

- [ ] 22.3 Build sound effects library
  - Create searchable SFX library
  - Implement category-based browsing
  - Support SFX preview
  - Allow custom SFX upload
  - _Requirements: 12.6, 12.7_

- [ ] 22.4 Implement audio mixing controls
  - Build audio level controls (voice, music, SFX)
  - Implement audio ducking for voice over music
  - Support fade in/out for audio tracks
  - Enable audio waveform visualization
  - _Requirements: 12.1_

- [ ]* 22.5 Write unit tests for audio library
  - Test music browsing
  - Test SFX search
  - Test audio mixing
  - _Requirements: 12.5_

---

### 23. Provider Adapters Implementation (Week 19)

- [ ] 23.1 Implement fal/Higgsfield video provider adapters
  - Create VideoProvider adapter for fal
  - Create VideoProvider adapter for Higgsfield
  - Support Kling, Seedance, Wan, Veo models
  - Handle provider-specific parameters
  - _Requirements: 17.1, 17.3_

- [ ] 23.2 Implement ElevenLabs voice provider adapter
  - Create VoiceProvider adapter for ElevenLabs
  - Support voice synthesis with settings
  - Implement voice cloning functionality
  - Handle voice listing and preview
  - _Requirements: 17.1, 12.1_

- [ ] 23.3 Implement Anthropic LLM provider adapter
  - Create LLMProvider adapter for Anthropic Claude
  - Support structured output generation
  - Implement text generation
  - Handle rate limiting and errors
  - _Requirements: 17.1, 5.1_

- [ ] 23.4 Build provider response standardization
  - Implement standardized result shape: status, outputURL, billedCost, providerJobId, errorClass
  - Handle provider-specific error mapping
  - Ensure consistent interface across all providers
  - _Requirements: 17.5, Property 8_

- [ ]* 23.5 Write property tests for provider response standardization
  - **Property 8: Provider Response Standardization** - Verify all responses match standard shape
  - **Validates: Requirements 17.5**

- [ ]* 23.6 Write unit tests for provider adapters
  - Test each provider adapter
  - Test error handling
  - Test response mapping
  - _Requirements: 17.1_

---

### 24. Testing and Quality Assurance (Week 20)

- [ ] 24.1 Implement comprehensive unit test suite
  - Test all provider layer adapters
  - Test credit calculation and ledger operations
  - Test scene state transitions
  - Test prompt validation and moderation
  - Test Zod schema validation
  - _Requirements: All_

- [ ] 24.2 Build integration test suite
  - Test end-to-end user journeys
  - Test workflow engine task execution
  - Test database operations with RLS policies
  - Test real-time subscription behavior
  - Test webhook handling and de-duplication
  - _Requirements: All_

- [ ] 24.3 Create E2E test suite with Playwright
  - Test new user signup and first video creation
  - Test project creation and character setup
  - Test story generation and script editing
  - Test scene generation and approval
  - Test timeline editing and export
  - _Requirements: All_

- [ ] 24.4 Build property-based test suite
  - Test all 20 defined correctness properties
  - Use fast-check or similar PBT library
  - Generate comprehensive test cases
  - Document property coverage
  - _Requirements: All properties_

- [ ] 24.5 Implement test automation in CI/CD
  - Run unit tests on every PR
  - Run integration tests on merge to develop
  - Run E2E tests on staging deployment
  - Track test coverage metrics
  - _Requirements: All_

- [ ] 24.6 Checkpoint - Verify testing coverage
  - Ensure all critical paths tested
  - Verify test coverage meets targets
  - Run full test suite
  - Ask the user if questions arise.

---

### 25. Deployment and DevOps (Week 21)

- [ ] 25.1 Set up development environment
  - Configure local development environment
  - Set up environment variable management
  - Create development database seed data
  - Document local setup process
  - _Requirements: 22.1_

- [ ] 25.2 Configure staging environment
  - Set up staging deployment on Vercel
  - Configure staging Supabase project
  - Set up staging Trigger.dev environment
  - Configure staging R2 bucket
  - _Requirements: 22.1_

- [ ] 25.3 Set up production environment
  - Configure production Vercel deployment
  - Set up production Supabase project
  - Configure production Trigger.dev environment
  - Set up production R2 bucket
  - Configure custom domain
  - _Requirements: 22.1_

- [ ] 25.4 Implement CI/CD pipeline
  - Create GitHub Actions workflow for CI
  - Set up automated testing in pipeline
  - Configure staging deployment on merge to develop
  - Configure production deployment on merge to main
  - Set up branch protection rules
  - _Requirements: 22.1_

- [ ] 25.5 Configure monitoring and alerting
  - Set up Sentry error alerting
  - Configure PostHog analytics dashboards
  - Implement health check endpoints
  - Set up uptime monitoring
  - Create operational runbook
  - _Requirements: 25.1, 25.2, 25.4_

- [ ] 25.6 Implement backup and disaster recovery
  - Configure automated database backups
  - Document disaster recovery procedures
  - Test backup restoration
  - Create runbook for common issues
  - _Requirements: 16.1_

- [ ] 25.7 Checkpoint - Verify deployment pipeline
  - Test staging deployment
  - Verify production deployment works
  - Ensure monitoring active
  - Ask the user if questions arise.

---

### 26. Documentation and Knowledge Base (Week 22)

- [ ] 26.1 Create user documentation
  - Write getting started guide
  - Document all user flows
  - Create FAQ section
  - Add troubleshooting guides
  - _Requirements: All_

- [ ] 26.2 Build API documentation
  - Document all REST endpoints
  - Create OpenAPI specification
  - Document webhook payloads
  - Add code examples
  - _Requirements: All_

- [ ] 26.3 Create developer documentation
  - Document architecture decisions
  - Write deployment guide
  - Create contribution guidelines
  - Document provider integration
  - _Requirements: All_

- [ ] 26.4 Build admin documentation
  - Document admin dashboard
  - Create operational runbooks
  - Document monitoring procedures
  - Add incident response guides
  - _Requirements: 25.4, 25.5_

---

### 27. Advanced Features - Phase 3 (Week 23+)

- [ ] 27.1 Build template library
  - Create template browsing interface
  - Implement template-based project creation
  - Support template customization
  - Build template management for admins
  - _Requirements: 2.6_

- [ ] 27.2 Implement collaboration features
  - Add project sharing functionality
  - Support multiple editors with conflict resolution
  - Implement commenting on scenes
  - Build collaboration permissions
  - _Requirements: All_

- [ ] 27.3 Build YouTube publishing integration
  - Implement YouTube OAuth flow
  - Create direct publish functionality
  - Support video metadata (title, description, tags)
  - Handle publishing errors gracefully
  - _Requirements: 14.4_

- [ ] 27.4 Implement additional AI model support
  - Add new video models as they become available
  - Support model-specific features
  - Update Model Registry
  - Handle model deprecations
  - _Requirements: 17.3, 17.6_

- [ ] 27.5 Build advanced analytics
  - Create user engagement dashboards
  - Track generation success rates
  - Monitor provider performance
  - Implement cost analysis tools
  - _Requirements: 25.2, 25.5_

---

### 28. Final Checkpoint and Launch Preparation

- [ ] 28.1 Complete end-to-end testing
  - Run full test suite
  - Perform security audit
  - Test all user flows
  - Verify accessibility compliance
  - _Requirements: All_

- [ ] 28.2 Performance validation
  - Load test with 100 concurrent projects
  - Verify response times meet targets
  - Test real-time performance
  - Validate database query performance
  - _Requirements: 22.1, 22.2, 22.3_

- [ ] 28.3 Security validation
  - Perform penetration testing
  - Verify RLS policies
  - Test authentication flows
  - Validate input sanitization
  - _Requirements: 1.1, 19.1, 20.1_

- [ ] 28.4 Launch preparation
  - Create launch checklist
  - Prepare rollback procedures
  - Set up launch monitoring
  - Brief support team
  - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach allowing iterative delivery
- Phase 1 (Weeks 1-14) delivers the core workflow end-to-end
- Phase 2 (Weeks 15-22) adds audio features, polish, and optimization
- Phase 3 (Week 23+) adds advanced features and scaling

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.9"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"] },
    { "id": 2, "tasks": ["1.10", "2.1", "2.3"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.5", "2.6", "3.1"] },
    { "id": 4, "tasks": ["2.7", "2.8", "3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "4.1", "4.2"] },
    { "id": 6, "tasks": ["4.3", "4.6"] },
    { "id": 7, "tasks": ["4.4", "4.5", "4.7", "4.8", "4.9"] },
    { "id": 8, "tasks": ["4.10", "5.1", "5.2"] },
    { "id": 9, "tasks": ["5.3", "5.4", "5.6", "5.7"] },
    { "id": 10, "tasks": ["5.5", "5.8", "6.1"] },
    { "id": 11, "tasks": ["6.2", "6.3", "6.6"] },
    { "id": 12, "tasks": ["6.4", "6.5", "6.7", "6.8", "6.9"] },
    { "id": 13, "tasks": ["6.10", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 14, "tasks": ["7.5", "7.6", "8.1"] },
    { "id": 15, "tasks": ["8.2", "8.5", "8.6", "8.7"] },
    { "id": 16, "tasks": ["8.3", "8.4", "8.8", "8.9", "8.10", "8.11", "8.12"] },
    { "id": 17, "tasks": ["8.13", "9.1", "9.2"] },
    { "id": 18, "tasks": ["9.3", "9.4", "9.5", "9.6", "9.7", "9.8"] },
    { "id": 19, "tasks": ["9.9", "10.1", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 20, "tasks": ["10.6", "10.7", "10.8", "11.1"] },
    { "id": 21, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8"] },
    { "id": 22, "tasks": ["11.9", "12.1", "12.2", "12.3", "12.4", "12.5"] },
    { "id": 23, "tasks": ["12.6", "12.7", "13.1", "13.2", "13.3", "13.4", "13.5"] },
    { "id": 24, "tasks": ["13.6", "14.1", "14.2", "14.3"] },
    { "id": 25, "tasks": ["14.4", "14.5", "14.6", "15.1", "15.2", "15.5"] },
    { "id": 26, "tasks": ["15.3", "15.4", "15.6", "15.7", "15.8"] },
    { "id": 27, "tasks": ["15.9", "16.1", "16.2", "16.3", "16.4"] },
    { "id": 28, "tasks": ["16.5", "16.6", "16.7", "17.1", "17.2", "17.3", "17.4"] },
    { "id": 29, "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5"] },
    { "id": 30, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5"] },
    { "id": 31, "tasks": ["20.1", "20.2", "20.3", "20.4", "20.5"] },
    { "id": 32, "tasks": ["21.1", "21.2", "21.3", "21.4"] },
    { "id": 33, "tasks": ["22.1", "22.2", "22.3", "22.4", "22.5"] },
    { "id": 34, "tasks": ["23.1", "23.2", "23.3", "23.4", "23.5", "23.6"] },
    { "id": 35, "tasks": ["24.1", "24.2", "24.3", "24.4", "24.5"] },
    { "id": 36, "tasks": ["24.6", "25.1", "25.2", "25.3", "25.4", "25.5", "25.6"] },
    { "id": 37, "tasks": ["25.7", "26.1", "26.2", "26.3", "26.4"] },
    { "id": 38, "tasks": ["27.1", "27.2", "27.3", "27.4", "27.5"] },
    { "id": 39, "tasks": ["28.1", "28.2", "28.3", "28.4"] }
  ]
}
```

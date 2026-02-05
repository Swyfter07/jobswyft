# JobSwyft Chrome Extension - State Diagrams

This document outlines the various state machines within the JobSwyft extension, including the Floating Action Button (FAB) behavior, Side Panel interactions, and key feature workflows.

## 1. Global Visibility & FAB State
The FAB's visibility is strictly coupled with the Side Panel's open state.

```mermaid
stateDiagram-v2
    direction LR
    
    state "Side Panel Closed" as Closed
    state "Side Panel Open" as Open
    
    [*] --> Closed
    
    state Closed {
        [*] --> FAB_Hidden
        FAB_Hidden --> [*]
    }
    
    state Open {
        [*] --> FAB_Visible
        
        state FAB_Visible {
            [*] --> Idle
            
            state "Idle (Menu Closed)" as Idle
            state "Menu Open" as MenuOpen
            state Dragging
            
            Idle --> MenuOpen : Click Main Btn
            MenuOpen --> Idle : Click Main Btn / Outside
            MenuOpen --> Idle : Click Action Code
            
            Idle --> Dragging : MouseDown + Move
            MenuOpen --> Dragging : MouseDown + Move
            Dragging --> Idle : MouseUp (Save Pos)
        }
    }

    Closed --> Open : User Clicks Toolbar Icon / Shortcut
    Open --> Closed : User Closes Panel / Tab Switch
```

## 2. Side Panel - Main View States
The Side Panel manages multiple collapsible sections (Accordion pattern).

```mermaid
stateDiagram-v2
    state "Side Panel View" as View {
        state "Resume Tray" as Tray
        state "App Tracker" as Tracker
        state "Smart Blocks" as SmartBlocks
        state "Feature Cards" as Features
        
        state Features {
            state "Page Scanner" as Scanner
            state "AI Answer Gen" as AIAnswer
            state "Cover Letter" as Cover
            state "AI Outreach" as Outreach
            state "AI Insights" as Insights
            
            [*] --> AllCollapsed
            AllCollapsed --> SingleExpanded : Click Header
            SingleExpanded --> AllCollapsed : Click Header
            SingleExpanded --> OtherExpanded : Click Other Header
        }
    }
```

## 3. Resume Tray Workflow
Manages the user's uploaded resume data.

```mermaid
stateDiagram-v2
    [*] --> Empty
    
    state "Empty / Default" as Empty {
        [*] --> UploadArea
    }
    
    state "Resume Loaded" as Loaded {
        state "PDF Uploaded" as PDF
        state "Parsed Data" as Parsed
        
        PDF --> Parsed : Click 'Generates Smart Blocks'
    }
    
    Empty --> Loaded : File Upload
    Loaded --> Empty : Clear / Remove
```

## 4. Page Scanner Workflow
Handles scraping job details from the active tab.

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    state Idle {
        [*] --> EmptyForm
        EmptyForm --> FilledForm : Manual Input
    }
    
    state Scanning {
        [*] --> ScrapeFrames : Heuristic Scan
        ScrapeFrames --> Success : Found Desc > 100ch
        ScrapeFrames --> AIFallback : Desc missing/short
        
        state AIFallback {
            [*] --> ExtractText
            ExtractText --> AIRequest : Send to OpenAI
            AIRequest --> Success
            AIRequest --> Failure
        }
    }
    
    Idle --> Scanning : Click 'Scan Page'
    Scanning --> Idle : Complete / Error
```

## 5. AI Insight Workflow
Manages API Key entry and match analysis.

```mermaid
stateDiagram-v2
    [*] --> CheckState
    
    state CheckState {
        [*] --> NoKey
        [*] --> HasKey
    }
    
    state "Input View" as NoKey {
        [*] --> EnterKey
        EnterKey --> HasKey : Save Clicked
    }
    
    state "Analyze View" as HasKey {
        [*] --> Ready
        Ready --> Analyzing : Click 'Analyze Match'
        Analyzing --> ResultsShown : Success
        Analyzing --> Error : Fail
        
        ResultsShown --> Ready : Re-analyze
        Ready --> NoKey : Remove Key
    }
```

## 6. Data Flow Overview
High-level flow of data between the page, side panel, storage, and OpenAI.

```mermaid
flowchart LR
    subgraph Page["Active Webpage"]
        PageDOM["Job Page DOM"]
        PageText["Page Text"]
        PageForms["Application Forms"]
    end

    subgraph SidePanel["Side Panel UI (sidepanel.html + sidepanel.js)"]
        UI["User Inputs & Actions"]
        ResumeTray["Resume Tray"]
        SmartBlocks["Smart Blocks (job_jet_profile)"]
        Scanner["Page Scanner"]
        AIViews["AI Answer / Cover / Outreach / Insights"]
    end

    subgraph Storage["chrome.storage.local"]
        Resumes["job_jet_resumes"]
        ActiveResume["job_jet_active_resume_id"]
        Profile["job_jet_profile"]
        Info["job_jet_info"]
        ApiKey["job_jet_openai_key"]
        Model["job_jet_openai_model"]
        Counter["job_jet_counter"]
        Pending["pendingFabAction"]
        FabPos["jobjetFabPosition"]
    end

    subgraph OpenAI["OpenAI API"]
        Chat["/v1/chat/completions"]
    end

    subgraph ContentScript["Content Script (fab-content.js)"]
        FAB["Floating Action Button"]
    end

    subgraph ServiceWorker["Service Worker (service-worker.js)"]
        SW["Visibility + FAB Action Router"]
    end

    PageDOM --> Scanner
    PageText --> Scanner
    Scanner --> UI
    ResumeTray --> Resumes
    Resumes --> SmartBlocks
    SmartBlocks --> Profile
    SmartBlocks --> Info
    UI --> Counter
    AIViews --> ApiKey
    AIViews --> Model
    AIViews --> Chat
    Chat --> AIViews
    Profile --> AIViews
    Scanner --> AIViews

    FAB --> SW
    SW --> Pending
    Pending --> UI
    SW --> FAB

    FAB --> FabPos
    FabPos --> FAB

    UI --> PageForms
    Profile --> PageForms
```

## 7. UI Flow (User Journeys)
Key user journeys through the side panel and FAB actions.

```mermaid
flowchart TD
    Start["User Opens Side Panel"] --> FABVisible["FAB Visible on Page"]

    FABVisible --> Action["FAB Action Click"]
    Action --> OpenPanel["Side Panel Opens + Scrolls to Section"]

    Start --> Resume["Upload Resume"]
    Resume --> Parse["Parse Resume"]
    Parse --> Smart["Edit Smart Blocks"]
    Smart --> Autofill["Autofill Application Form"]

    Start --> Scan["Scan Page"]
    Scan --> JD["Job Title / Company / Description Filled"]

    JD --> Answer["Generate AI Answer"]
    JD --> Cover["Generate Cover Letter"]
    JD --> Outreach["Generate Outreach Message"]
    JD --> Insights["Analyze Match"]

    Answer --> Copy["Copy Output"]
    Cover --> Export["Copy or PDF Export"]
    Outreach --> Copy
    Insights --> Review["Review Match Results"]
```

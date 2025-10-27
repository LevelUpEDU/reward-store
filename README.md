# LevelUpEDU
A gamified educational platform for web and mobile where students navigate a 2d RPG-like world and complete challenges to earn rewards.

## Quick Start

1. Clone the repo
2. Run the following commands:
```sh
pnpm install
pnpm dev
```
3. Navigate to: <https://localhost:8080/game>

## Project Structure
```
src/
├── app/             # Next.js App Router, API endpoints, pages
├── components/      # React / Phaser bridge and initialization wrapper
├── data/            # Tiled map JSON files
├── interactions/    # Interaction handlers for each possible interaction
├── scenes/          # Scene class (main game loop), and individual scenes
├── types/           # TypeScript interfaces
└── utils/           # InputHandler, physics helpers, sprite effects
```

## Adding Interactable Objects

1. Add sprite to manifest: `public/assets/sprites/{sceneName}/manifest.json`
2. Add sprite image to same folder: `public/assets/sprites/{sceneName}/{spriteName}.png`
3. In Tiled add the object to "Interactable" layer with these fields:
    - eventType: Name of interaction (e.g., "chalkboard")
    - active: true/false - whether interaction is enabled
    - displayName: Text label player sees
    - tooltip: Interaction prompt
    - passable: false if player can't walk through
    - pulseColor: Optional hex color for animation like "#ffffff"
4. Create file with interaction code in src/interactions/{name}.ts
5. Register the interaction by adding import in src/interactions/index.ts

## Business Rules

1. Transactions must reference exactly one of: submission OR redemption
2. Student points are not stored in student table to protect against data inconsistency (use a SUM instead) 
3. Students cannot register for the same course multiple times
4. Student points cannot go negative (redemptions will be prevented if insufficient points)
5. REWARD cost must be >= 0
6. REWARD quantity_limit must be NULL (unlimited) or an integer > 0
7. REWARD automatically deactivates when calculated quantity reaches 0
8. REWARD quantity remaining to be calculated from REDEMPTION table and compared against REWARD quantity_limit
9. Cancelled redemptions do not change REWARD back to active or add quantity to rewards
## Database Schema
```mermaid
---
config:
  layout: elk
---
erDiagram
	direction BT
	
	STUDENT {
		string id PK
		string name
		date last_signin "nullable"
	}
	
	INSTRUCTOR {
		string id PK
		string name
		date last_signin "nullable"
	}
	
	REGISTRATION {
		string student_id FK
		int course_id FK
		string COMPOSITE_PK "PRIMARY KEY (student_id, course_id)"
	}
	
	COURSE {
		int id PK
		string course_code "unique, auto-generated"
		string instructor_id FK
		string title
		text description "nullable"
	}
	
	QUEST {
		int id PK
		int course_id FK
		string created_by FK "references INSTRUCTOR"
		string title
		int points
		date created_date
		date expiration_date "nullable"
	}
	
	SUBMISSION {
		int id PK
		string student_id FK
		int quest_id FK
		date submission_date
		enum status "pending | approved | rejected"
		string verified_by FK "nullable, references INSTRUCTOR"
		date verified_date "nullable"
	}
	
	TRANSACTION {
		int id PK
		string student_id FK
		int points_value
		date transaction_date
		int submission_id FK "nullable"
		int redemption_id FK "nullable"
	}
	
	REDEMPTION {
		int id PK
		string student_id FK
		int reward_id FK
		date redemption_date
		enum status "pending | fulfilled | cancelled"
		date fulfillment_date "nullable"
		text instructor_notes "nullable"
		text student_notes "nullable"
	}
	
	REWARD {
		int id PK
		int course_id FK
		date created_date
		string name
		text description "nullable"
		int cost
		int quantity_limit "nullable"
		enum type "unspecified"
		boolean active "default true"
	}
	
	STUDENT||--o{REGISTRATION:"has"
	COURSE||--o{REGISTRATION:"contains"
	INSTRUCTOR||--o{COURSE:"teaches"
	COURSE||--o{QUEST:"has"
	INSTRUCTOR||--o{QUEST:"creates"
	COURSE||--o{REWARD:"has"
	STUDENT||--o{SUBMISSION:"submits"
	QUEST||--o{SUBMISSION:"receives"
	INSTRUCTOR||--o{SUBMISSION:"verifies"
	STUDENT||--o{TRANSACTION:"has"
	STUDENT||--o{REDEMPTION:"initiates"
	REWARD||--o{REDEMPTION:"redeemed as"
	SUBMISSION||--||TRANSACTION:"creates"
	REDEMPTION||--||TRANSACTION:"creates"
```
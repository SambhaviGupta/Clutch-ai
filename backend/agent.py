import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "models/gemini-2.5-flash"

tools = [types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="classify_deadline",
        description="Classifies the user crisis to determine task type, time available, and artifact type needed",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "task_type": types.Schema(type=types.Type.STRING),
                "topic": types.Schema(type=types.Type.STRING),
                "time_available_minutes": types.Schema(type=types.Type.INTEGER),
                "artifact_type": types.Schema(type=types.Type.STRING),
                "urgency_level": types.Schema(type=types.Type.STRING),
            },
            required=["task_type", "topic", "time_available_minutes", "artifact_type", "urgency_level"]
        )
    ),
    types.FunctionDeclaration(
        name="generate_work_artifact",
        description="Generates actual work content like revision sheet, outline, or talking points",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "task_type": types.Schema(type=types.Type.STRING),
                "topic": types.Schema(type=types.Type.STRING),
                "artifact_type": types.Schema(type=types.Type.STRING),
                "time_available_minutes": types.Schema(type=types.Type.INTEGER),
            },
            required=["task_type", "topic", "artifact_type", "time_available_minutes"]
        )
    ),
    types.FunctionDeclaration(
        name="create_sprint_plan",
        description="Creates structured sprint blocks based on artifact and available time",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "topic": types.Schema(type=types.Type.STRING),
                "task_type": types.Schema(type=types.Type.STRING),
                "time_available_minutes": types.Schema(type=types.Type.INTEGER),
                "artifact_content": types.Schema(type=types.Type.STRING),
            },
            required=["topic", "task_type", "time_available_minutes"]
        )
    ),
])]

def execute_classify_deadline(args: dict) -> dict:
    return args

def execute_generate_artifact(args: dict) -> str:
    prompts = {
        "revision_sheet": f"""Create a rapid revision sheet for {args['topic']} for someone with {args['time_available_minutes']} minutes before their exam.
Include: Key concepts (bullet points), Important formulas/definitions, Likely exam questions with one-line answers, Memory tricks.
Be concise and high-yield. Format clearly with sections.""",
        "outline": f"""Create a detailed outline for a {args['topic']} {args['task_type']} with {args['time_available_minutes']} minutes to complete.
Include: Main sections with subsections, key points per section, suggested time per section. Make it immediately actionable.""",
        "talking_points": f"""Create presentation talking points for {args['topic']} with {args['time_available_minutes']} minutes to prepare.
Include: Opening hook, 3-5 main points with details, anticipated Q&A, strong closing. Format for quick scanning.""",
        "research_brief": f"""Create an interview research brief for {args['topic']} with {args['time_available_minutes']} minutes to prepare.
Include: Key facts, likely questions with strong answers, things to avoid. Keep it scannable.""",
        "code_scaffold": f"""Create a code scaffold for {args['topic']} with {args['time_available_minutes']} minutes to complete.
Include: File structure, core functions with docstrings, key algorithms, common pitfalls.""",
        "checklist": f"""Create an urgent action checklist for {args['topic']} with {args['time_available_minutes']} minutes.
Prioritize by impact. Include specific actionable steps only."""
    }
    prompt = prompts.get(args.get("artifact_type", "outline"), prompts["outline"])
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return response.text

def execute_create_sprint_plan(args: dict) -> list:
    prompt = f"""Create a sprint plan for {args['topic']} ({args['task_type']}) with {args['time_available_minutes']} minutes total.

Based on this content:
{args.get('artifact_content', '')[:1000]}

Return a JSON array of sprint objects. Each sprint must have:
- title: short sprint name
- goal: specific micro-goal (1-2 sentences)
- duration_minutes: integer (25-45 mins each)

Make the last sprint a review/mock Q&A. Return ONLY valid JSON array, no markdown."""
    response = client.models.generate_content(model=MODEL, contents=prompt)
    try:
        text = response.text.strip().strip("```json").strip("```").strip()
        return json.loads(text)
    except:
        sprint_duration = min(45, args['time_available_minutes'] // 4)
        return [
            {"title": "Sprint 1: Core concepts", "goal": f"Cover fundamentals of {args['topic']}", "duration_minutes": sprint_duration},
            {"title": "Sprint 2: Deep dive", "goal": "Work through complex parts", "duration_minutes": sprint_duration},
            {"title": "Sprint 3: Practice", "goal": "Apply concepts with examples", "duration_minutes": sprint_duration},
            {"title": "Sprint 4: Review & mock", "goal": "Final review and mock questions", "duration_minutes": sprint_duration},
        ]

def execute_adapt_plan(args: dict) -> dict:
    remaining = args.get("remaining_sprints", [])
    time_remaining = args.get("time_remaining_minutes", 60)
    if not remaining:
        return {"updated_sprints": [], "dropped_topics": [], "message": "All sprints complete!"}
    total_needed = sum(s.get("duration_minutes", 30) for s in remaining)
    if total_needed <= time_remaining:
        return {"updated_sprints": remaining, "dropped_topics": [], "message": f"You're on track! {len(remaining)} sprints remaining."}
    dropped = []
    adjusted = []
    time_used = 0
    for sprint in remaining[:-1]:
        if time_used + sprint["duration_minutes"] <= time_remaining - 20:
            adjusted.append(sprint)
            time_used += sprint["duration_minutes"]
        else:
            dropped.append(sprint["title"])
    if time_remaining - time_used >= 15:
        adjusted.append({"title": "Quick Review", "goal": "Rapid review of all covered material", "duration_minutes": time_remaining - time_used})
    return {"updated_sprints": adjusted, "dropped_topics": dropped, "message": f"Plan adapted. Dropped {len(dropped)} lower-priority topics to keep you on track."}

async def run_rescue_agent(crisis_message: str) -> dict:
    system_prompt = """You are Clutch, an autonomous crisis rescue agent. When a user shares their deadline crisis:
1. IMMEDIATELY call classify_deadline to understand the situation
2. THEN call generate_work_artifact to create actual useful content
3. THEN call create_sprint_plan to build a time-blocked action plan

Be autonomous. Do NOT ask permission. Chain all three tools without stopping.
After all tools complete, give one short encouraging message (2 sentences max)."""

    contents = [types.Content(role="user", parts=[types.Part(text=f"{system_prompt}\n\nUser crisis: {crisis_message}")])]
    classification = None
    artifact_content = None
    sprint_plan = None
    final_message = "Your rescue plan is ready. Let's go — you've got this."

    for _ in range(10):
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                tools=tools,
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode="AUTO")
                )
            )
        )

        parts = response.candidates[0].content.parts
        has_tool_call = any(hasattr(p, 'function_call') and p.function_call and p.function_call.name for p in parts)

        if not has_tool_call:
            final_message = " ".join(p.text for p in parts if hasattr(p, 'text') and p.text) or final_message
            break

        contents.append(types.Content(role="model", parts=parts))
        tool_response_parts = []

        for part in parts:
            if hasattr(part, 'function_call') and part.function_call and part.function_call.name:
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args)

                if fn_name == "classify_deadline":
                    result = execute_classify_deadline(fn_args)
                    classification = result
                    result_payload = result
                elif fn_name == "generate_work_artifact":
                    if classification:
                        fn_args.update({k: v for k, v in classification.items() if k not in fn_args})
                    result = execute_generate_artifact(fn_args)
                    artifact_content = result
                    result_payload = {"content": result}
                elif fn_name == "create_sprint_plan":
                    if artifact_content:
                        fn_args["artifact_content"] = artifact_content
                    result = execute_create_sprint_plan(fn_args)
                    sprint_plan = result
                    result_payload = {"sprints": json.dumps(result)}
                else:
                    result_payload = {}

                tool_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name,
                            response=result_payload
                        )
                    )
                )

        contents.append(types.Content(role="user", parts=tool_response_parts))

    return {
        "classification": classification,
        "artifact_content": artifact_content,
        "sprint_plan": sprint_plan or [],
        "agent_message": final_message
    }
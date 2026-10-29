/* ==========================================================================
   Pastoral Oversight at RLCC — course content
   --------------------------------------------------------------------------
   Edit freely. Card types:
     idea      title, body, points[], note
     scripture ref, text (paraphrase), insight
     list      title, intro, items[{h,b}], note        (tap to expand)
     compare   title, left, right, rows[[a,b]]
     choice    q, opts[{x, ok, fb}]                    (quick check)
     sort      q, opts[], items[{x, a, why}]           (a = index of right option)
     reflect   title, prompt, hint                     (saved; needs 10+ characters)
     action    title, intro, steps[], done, fields[]   (Put it into practice)
   Card ids are built from lesson id + position (e.g. L3-5). If you reorder or
   insert cards after people have started, give the card a fixed  key:"..."
   so existing progress stays attached to the right card.
   ========================================================================== */
(function () {
  function L(id, title, minutes, outcome, cards) {
    cards.forEach(function (c, i) { c.id = c.key || ("L" + id + "-" + (i + 1)); });
    return { id: id, title: title, minutes: minutes, outcome: outcome, cards: cards };
  }

  window.COURSE = {
    id: "pastoral-oversight-2027",
    title: "Pastoral Oversight at RLCC",
    tagline: "From running ministry to raising leaders",
    lessons: [

      /* ---------------------------------------------------------------- 1 */
      L(1, "The shift", 6,
        "Describe the move from running ministry to developing and overseeing lay leaders, and spot where you may be the bottleneck.", [
        { t: "idea", title: "From managing ministry to developing leaders",
          body: "RLCC is moving from a pastor-centered model to a leadership-development and oversight model.\n\nPastors will no longer be mainly responsible for making every ministry activity happen. They will equip, develop, guide, and oversee the lay leaders who lead our communities and ministries." },
        { t: "idea", title: "This is not a withdrawal",
          body: "You are not stepping back from ministry. You are stepping up to a different level: from routinely running ministry operations to developing people who can lead faithfully and effectively.\n\nYour calling has not shrunk. It is being multiplied." },
        { t: "compare", title: "Two ways of leading", left: "Traditional model", right: "Oversight model",
          rows: [
            ["Pastor leads the community or ministry", "Pastor develops and oversees its lay leaders"],
            ["Plan, organize, and execute", "Coach leaders, clarify direction, monitor health"],
            ["Decisions flow through the pastor", "Appropriate decisions are delegated to lay leaders"],
            ["Success: the ministry runs well under the pastor", "Success: the ministry thrives through equipped lay leaders"],
            ["Result: dependence on a capable pastor", "Result: a growing community of leaders who develop others"]
          ] },
        { t: "choice", title: "Your first response",
          q: "An hour before Real Life Youth begins, two volunteers cancel and the lay leader texts you in a panic. Which response best fits the oversight model?",
          opts: [
            { x: "Drive over and run the program yourself.", fb: "It solves tonight, but it teaches the leader to wait for you next time." },
            { x: "Ask: “What options have you considered, and what do you think is the wisest next step?”", ok: true, fb: "Yes. You stay available while the leader practices solving the problem. Sometimes you will still step in, but by choice, not by reflex." },
            { x: "Tell the leader to cancel and that you will sort it out on Monday.", fb: "That avoids the problem without developing anyone." }
          ] },
        { t: "reflect", title: "Where am I the bottleneck?",
          prompt: "Think of the community or ministry you serve. Which decisions or tasks still pass through you? What makes it hard to let go?",
          hint: "Be honest and specific. No one else will grade this." },
        { t: "action", title: "Map what only you do",
          intro: "Awareness comes first. This takes about 20 minutes.",
          steps: [
            "List every ministry task you did personally last week.",
            "Mark each one: could a lay leader do this with some coaching?",
            "Circle the three you will hand over first."
          ],
          done: "You have a written list of three tasks to hand over." }
      ]),

      /* ---------------------------------------------------------------- 2 */
      L(2, "Rooted in Scripture", 7,
        "Explain four biblical foundations for pastoral oversight and how each shapes your role.", [
        { t: "scripture", ref: "Ephesians 4:11–12",
          text: "Christ gave shepherds and teachers to the church to equip God’s people for works of service, so that the body of Christ is built up.",
          insight: "Your guiding question becomes: “Whom do I need to equip so that this ministry can fulfill its purpose?”" },
        { t: "scripture", ref: "2 Timothy 2:2",
          text: "What you have heard from me, entrust to faithful people who will be able to teach others also.",
          insight: "Paul to Timothy, Timothy to faithful people, those people to others. Delegation asks who can do a task. Multiplication asks who can become capable of leading and developing others." },
        { t: "scripture", ref: "Acts 20:28",
          text: "Keep watch over yourselves and over the flock the Holy Spirit has entrusted to you, and shepherd the church of God.",
          insight: "Oversight is more than administrative supervision. It includes spiritual care, doctrinal faithfulness, protection, guidance, and responsibility for the health of the church. Know your leaders. Don’t only audit them." },
        { t: "scripture", ref: "Exodus 18:17–23",
          text: "Jethro told Moses that doing everything himself would wear out both him and the people. He urged Moses to choose capable, God-fearing leaders to handle the everyday matters.",
          insight: "One leader carrying every responsibility becomes the bottleneck through which every decision must pass." },
        { t: "choice", title: "Which passage fits?",
          q: "A pastor must approve every decision in a ministry, and people wait in line for answers. Which passage speaks most directly to this?",
          opts: [
            { x: "Ephesians 4:11–12", fb: "This one is about the pastor’s purpose: equipping. It is related, but not the closest match." },
            { x: "2 Timothy 2:2", fb: "This one is about multiplication across generations. Related, but not the closest match." },
            { x: "Exodus 18:17–23", ok: true, fb: "Yes. Jethro saw the bottleneck and the toll it takes on the leader and the people." },
            { x: "Acts 20:28", fb: "This one is about the scope of shepherding oversight. Related, but not the closest match." }
          ] },
        { t: "reflect", title: "Which passage presses on you?",
          prompt: "Which of the four passages challenges you most right now, and why?",
          hint: "Write a few honest sentences." },
        { t: "action", title: "Pray and plan with the Word",
          intro: "Let Scripture shape the plan before the plan shapes the ministry.",
          steps: [
            "Read Exodus 18:13–27 slowly, once, in prayer.",
            "Write down the names of two lay leaders you could begin to develop.",
            "Pray for each of them by name every day this week."
          ],
          done: "Two names written and prayed over for seven days." }
      ]),

      /* ---------------------------------------------------------------- 3 */
      L(3, "Three levels, five responsibilities", 7,
        "Describe what each level of leadership does, and the five responsibilities of an overseeing pastor.", [
        { t: "list", title: "Three levels of leadership", intro: "Tap each level to see its focus.",
          items: [
            { h: "Level 1: Senior Pastor. Vision and overall oversight", b: "Clarifies RLCC’s mission, vision, and priorities. Develops the Spiritual Leadership Team. Makes sure pastors fulfill their oversight responsibilities. Sets expectations for lay leadership development and reviews the health of communities and ministries." },
            { h: "Level 2: Pastors. Oversight and leadership development", b: "Each pastor is assigned designated communities or ministries to oversee. The work centers on five responsibilities: develop, equip, empower, monitor, and shepherd." },
            { h: "Level 3: Lay leaders. Direct leadership and ministry execution", b: "Lay leaders become the primary leaders of their communities and ministries. They plan and implement, lead teams, care for people, develop additional leaders, meet agreed objectives, and report progress and challenges to their overseeing pastor." }
          ] },
        { t: "list", title: "Five responsibilities of an overseeing pastor", intro: "This is your Level 2 job description.",
          items: [
            { h: "Develop", b: "Identify potential lay leaders, assess readiness, and help them grow in character, competence, commitment, community, and capacity." },
            { h: "Equip", b: "Provide coaching, training, spiritual guidance, and practical help." },
            { h: "Empower", b: "Give lay leaders meaningful authority to make decisions, organize activities, solve problems, and lead within agreed boundaries." },
            { h: "Monitor", b: "Regularly review the health, progress, and challenges of your assigned communities or ministries." },
            { h: "Shepherd", b: "Care for leaders spiritually, relationally, and personally. Help them stay healthy and faithful in ministry." }
          ] },
        { t: "idea", title: "Tasks are not the same as leadership",
          body: "The goal is not to give lay leaders more tasks. It is to give them genuine leadership responsibility.\n\nA pastor who delegates tasks but keeps every meaningful decision is still effectively running the ministry." },
        { t: "sort", title: "Which responsibility is this?",
          q: "Match each pastoral action to the responsibility it best fits.",
          opts: ["Develop", "Equip", "Empower", "Monitor", "Shepherd"],
          items: [
            { x: "Noticing a quiet member who might lead someday", a: 0, why: "Identifying potential leaders is Develop." },
            { x: "Teaching a leader how to run a team meeting", a: 1, why: "Training and practical help is Equip." },
            { x: "Letting a leader decide the venue and schedule for a gathering", a: 2, why: "Giving real decision-making authority is Empower." },
            { x: "Meeting monthly to review how a community is doing", a: 3, why: "Regular review of health and progress is Monitor." },
            { x: "Praying with a leader who is discouraged", a: 4, why: "Caring for the leader as a person is Shepherd." }
          ] },
        { t: "reflect", title: "My natural strengths and gaps",
          prompt: "Which of the five responsibilities do you do most naturally? Which one do you tend to neglect, and why?",
          hint: "Think about the last month." },
        { t: "action", title: "Decide what you will release",
          intro: "Empowerment becomes real when a decision changes hands.",
          steps: [
            "Choose one lay leader you oversee.",
            "Write down three decisions that leader can now make without asking you.",
            "Have the conversation. Agree together on the boundaries."
          ],
          done: "One leader knows which decisions are theirs." }
      ]),

      /* ---------------------------------------------------------------- 4 */
      L(4, "Coach, don’t take over", 6,
        "Respond to leaders’ problems with coaching questions instead of automatic solutions.", [
        { t: "idea", title: "When a problem appears, pause",
          body: "When a problem occurs, the pastor should not automatically take over.\n\nEvery time you solve a leader’s problem, you teach them that you hold the answers. Every time you ask a good question, you teach them they can find the way.\n\nYou will still step in when it is needed. The goal is to make that a choice, not a reflex." },
        { t: "list", title: "Four questions to ask first", intro: "Keep these where you can see them.",
          items: [
            { h: "“What do you think is happening?”", b: "Helps the leader name the real situation before anyone jumps to a fix." },
            { h: "“What options have you considered?”", b: "Brings the leader’s own ideas to the surface." },
            { h: "“What do you believe is the wisest next step?”", b: "Builds judgment and ownership of the decision." },
            { h: "“What support do you need from me?”", b: "Keeps you a partner, not a rescuer." }
          ] },
        { t: "choice", title: "Your first response",
          q: "A leader says: “My team keeps arguing about the schedule, and no one comes to planning meetings.” What is the best first response?",
          opts: [
            { x: "Call the team together yourself and settle it.", fb: "That takes the leader’s role. The leader learns nothing about handling conflict." },
            { x: "“What do you think is happening?”", ok: true, fb: "Yes. Start by helping the leader see the situation. The other questions follow." },
            { x: "Give the leader a new team structure to implement.", fb: "A ready-made solution skips the leader’s own thinking." }
          ] },
        { t: "choice", title: "Spot the coaching question",
          q: "Which of these is a coaching question?",
          opts: [
            { x: "“Why didn’t you just do it the way I showed you?”", fb: "That is a rebuke, not a question that opens thinking." },
            { x: "“What would the wisest next step look like to you?”", ok: true, fb: "Yes. It is open, it trusts the leader, and it asks for their judgment." },
            { x: "“Let me handle it. I know those people.”", fb: "That is taking over." }
          ] },
        { t: "reflect", title: "A time I took over",
          prompt: "Think of a recent time you stepped in and solved a leader’s problem. What did you say or do? Write the coaching question you could have asked instead.",
          hint: "A question, not a statement." },
        { t: "action", title: "Practice the four questions",
          intro: "Coaching is a skill. It grows by use.",
          steps: [
            "In one real conversation this week, use all four questions with a lay leader.",
            "Hold back your own solution until they have shared theirs.",
            "Afterward, write down what they said and what surprised you."
          ],
          done: "One coaching conversation held and noted." }
      ]),

      /* ---------------------------------------------------------------- 5 */
      L(5, "Reorient your time", 6,
        "Sort your work into oversight, strategic participation, and routine operations, and plan to shift time toward leadership development.", [
        { t: "idea", title: "Where does your time go?",
          body: "Pastors can be tempted to show their value by being busy: solving problems, organizing events, making things happen.\n\nOversight asks for a different measure. How well are leaders being developed? Time is where the shift becomes real." },
        { t: "list", title: "Three kinds of pastoral work", intro: "Tap to see what belongs in each.",
          items: [
            { h: "A. Oversight and leadership development", b: "Coaching lay leaders. Leadership-development conversations. Reviewing ministry health. Identifying and developing emerging leaders. Caring for leaders. Addressing significant ministry concerns." },
            { h: "B. Strategic ministry participation", b: "Taking part in important gatherings. Teaching or preaching when needed. Modeling ministry practices. Supporting significant initiatives. Helping leaders through major transitions." },
            { h: "C. Routine operational work", b: "Arranging schedules. Coordinating ordinary activities. Preparing routine programs. Managing logistics. Following up on routine administration." }
          ],
          note: "The aim is to transfer appropriate routine work (C) to lay leaders and their teams. B remains appropriate, but it should not consistently displace A." },
        { t: "sort", title: "Sort your work",
          q: "Place each activity in the category it best fits.",
          opts: ["A Oversight", "B Strategic", "C Routine"],
          items: [
            { x: "Coaching a leader through a hard decision", a: 0, why: "Coaching is oversight and leadership development." },
            { x: "Preaching at a key gathering when asked", a: 1, why: "Teaching or preaching when needed is strategic participation." },
            { x: "Arranging volunteer schedules", a: 2, why: "Schedules are routine operations to hand to leaders and teams." },
            { x: "Reviewing a community’s health with its leader", a: 0, why: "Reviewing ministry health is oversight." },
            { x: "Supporting a major new initiative", a: 1, why: "Supporting significant initiatives is strategic participation." },
            { x: "Preparing routine weekly programs", a: 2, why: "Routine programs are operational work." },
            { x: "Spotting and developing an emerging leader", a: 0, why: "This is the heart of oversight." }
          ] },
        { t: "idea", title: "Start with an honest look",
          body: "Before you set any targets, review how you currently spend your time.\n\nDon’t aim for a perfect ratio. Aim for honesty first, then a steady shift." },
        { t: "reflect", title: "What would a week reveal?",
          prompt: "If you tracked last week honestly, what would surprise you? Roughly how much of your time went to routine operations?",
          hint: "A rough guess is enough." },
        { t: "action", title: "One-week time audit",
          intro: "You can’t shift what you haven’t seen.",
          steps: [
            "For seven days, note what you do in half-day blocks as A, B, or C.",
            "At the end of the week, estimate your rough percentages.",
            "Choose one routine (C) task to hand to a lay leader, and name who."
          ],
          done: "A week tracked and one routine task assigned to a leader." }
      ]),

      /* ---------------------------------------------------------------- 6 */
      L(6, "Coaching with LEAD", 7,
        "Use the five LEAD questions (Character, Competency, Commitment, Community, Capacity) to guide development conversations.", [
        { t: "idea", title: "LEAD gives you a map",
          body: "RLCC’s Leadership Empowerment & Development (LEAD) system gives you a framework for coaching lay leaders.\n\nInstead of asking only “Is the ministry working?”, you ask five deeper questions about the leader." },
        { t: "list", title: "The five questions", intro: "Tap each one.",
          items: [
            { h: "Character", b: "Is the leader growing in Christlikeness and spiritual maturity?" },
            { h: "Competency", b: "Is the leader becoming more capable of leading people and fulfilling ministry responsibilities?" },
            { h: "Commitment", b: "Is the leader faithful to Christ, the church, and the ministry entrusted to them?" },
            { h: "Community", b: "Is the leader building healthy relationships and developing people within the body of Christ?" },
            { h: "Capacity", b: "Is the leader becoming able to carry greater responsibility and develop other leaders?" }
          ] },
        { t: "idea", title: "Questions to ask a leader",
          body: "Choose one or two for your next conversation:",
          points: [
            "What have you learned about leading people this month?",
            "What leadership challenge are you facing?",
            "How are you developing the people who serve with you?",
            "Who is beginning to show leadership potential?",
            "What responsibility can you entrust to someone else?",
            "What do you need to grow in character, competency, commitment, community, or capacity?"
          ] },
        { t: "sort", title: "Which C needs attention?",
          q: "Match each situation to the LEAD area it points to most clearly.",
          opts: ["Character", "Competency", "Commitment", "Community", "Capacity"],
          items: [
            { x: "A gifted leader shows growing pride and a short temper with the team.", a: 0, why: "Christlikeness and spiritual maturity: Character." },
            { x: "A prayerful, humble leader struggles to plan a gathering or run a team meeting.", a: 1, why: "A skill gap in leading people and ministry: Competency." },
            { x: "A capable leader has missed several agreed responsibilities with little explanation.", a: 2, why: "Faithfulness to what was entrusted: Commitment." },
            { x: "The team is efficient, but newcomers rarely feel they belong.", a: 3, why: "Healthy relationships and belonging: Community." },
            { x: "A leader does well and may be ready for a bigger role, but has not raised up anyone else.", a: 4, why: "Carrying more and developing leaders: Capacity." }
          ] },
        { t: "reflect", title: "One leader, five lenses",
          prompt: "Pick one lay leader you oversee. In which of the five areas are they strongest? Which needs your attention next?",
          hint: "Use first names or initials if you wish." },
        { t: "action", title: "Hold a LEAD conversation",
          intro: "One honest, unhurried conversation can change a leader’s year.",
          steps: [
            "Schedule 45 minutes with one lay leader.",
            "Ask three of the coaching questions. Listen more than you speak.",
            "Agree on one growth step and when you will check in."
          ],
          done: "One LEAD conversation held with a growth step agreed." }
      ]),

      /* ---------------------------------------------------------------- 7 */
      L(7, "The monthly oversight review", 6,
        "Run a monthly review in which the lay leader helps assess the ministry’s health.", [
        { t: "idea", title: "A rhythm, not a rescue",
          body: "Oversight needs a regular rhythm. A monthly review helps you see reality alongside the leader instead of waiting for a crisis." },
        { t: "list", title: "Seven areas to review", intro: "Tap each area for its questions.",
          items: [
            { h: "Spiritual health", b: "Are people growing in their relationship with Jesus and obedience to his Word?" },
            { h: "Community health", b: "Are relationships healthy? Are people receiving care and experiencing belonging?" },
            { h: "Mission", b: "Are we reaching people and helping them take meaningful steps toward discipleship?" },
            { h: "Leadership", b: "Are current leaders functioning well? Are new leaders emerging?" },
            { h: "Development", b: "What have our leaders learned, and what do they need to develop next?" },
            { h: "Challenges", b: "What obstacles or concerns need pastoral guidance or intervention?" },
            { h: "Next steps", b: "What are the most important actions before the next review?" }
          ] },
        { t: "idea", title: "The leader assesses too",
          body: "The lay leader should take an active part in assessing the ministry. They are not there to receive your verdict.\n\nYour role is to help them see clearly, exercise sound judgment, and take appropriate action. A review you complete alone teaches them to wait for your conclusions." },
        { t: "choice", title: "Preparing for the review",
          q: "How should you prepare for a monthly review?",
          opts: [
            { x: "Complete the review yourself and present the results.", fb: "That keeps the leader a spectator." },
            { x: "Ask the leader to reflect on the seven areas first, then compare notes together.", ok: true, fb: "Yes. The leader owns the assessment, and you help them see more clearly." },
            { x: "Skip the review unless something goes wrong.", fb: "Oversight is a rhythm. Waiting for trouble makes every review a rescue." }
          ] },
        { t: "reflect", title: "Which area do I skip?",
          prompt: "Which of the seven areas do you review least often? What does it cost the ministry when it goes unreviewed?",
          hint: "" },
        { t: "action", title: "Schedule your first review",
          intro: "Start with one community or ministry.",
          steps: [
            "Invite the lay leader and send the seven areas ahead of time.",
            "In the meeting, let the leader speak first on each area.",
            "Close by agreeing on the most important next steps before the next review."
          ],
          done: "One monthly review held, with next steps agreed." }
      ]),

      /* ---------------------------------------------------------------- 8 */
      L(8, "Knowing when to step in", 8,
        "Decide when to coach and when to intervene directly, and keep safeguarding concerns out of ordinary coaching.", [
        { t: "idea", title: "Lay leaders lead",
          body: "Pastors equip, guide, and hold leaders accountable.\n\nPastors intervene directly when a situation requires pastoral authority, specialized competence, or protection of people and the church." },
        { t: "compare", title: "Coach or step in?", left: "Situation", right: "Expected pastoral response",
          rows: [
            ["Difficulty organizing an ordinary gathering", "Coach the leader to build a workable plan."],
            ["Poor communication in a ministry team", "Help the leader address it and improve team processes."],
            ["Leader not fulfilling agreed responsibilities", "Clarify expectations, explore obstacles, and set accountability."],
            ["Leader lacks a necessary skill", "Provide training or connect them with someone who can help."],
            ["Serious conflict between members", "Provide pastoral intervention and guide reconciliation."],
            ["Safeguarding concern, abuse allegation, or serious misconduct", "Follow established safeguarding procedures and intervene promptly."],
            ["Significant doctrinal or theological concern", "Exercise pastoral oversight and give clear guidance."]
          ] },
        { t: "idea", title: "Safeguarding is never ordinary coaching",
          body: "If there is a safeguarding concern, an abuse allegation, or serious misconduct, follow RLCC’s established safeguarding procedures and act promptly.\n\nDo not leave it to ordinary coaching." },
        { t: "sort", title: "Coach or step in?",
          q: "Decide how you would respond to each situation.",
          opts: ["Coach", "Step in"],
          items: [
            { x: "A leader struggles to plan an ordinary gathering.", a: 0, why: "Coach the leader to a workable plan." },
            { x: "Two members are in serious conflict.", a: 1, why: "Serious conflict calls for pastoral intervention and guided reconciliation." },
            { x: "A leader is missing agreed responsibilities.", a: 0, why: "Clarify expectations, explore obstacles, and set accountability." },
            { x: "Someone raises a possible abuse allegation.", a: 1, why: "Follow safeguarding procedures and act promptly." },
            { x: "A leader lacks a skill they need.", a: 0, why: "Train them or connect them with someone who can." },
            { x: "A leader teaches something that raises a significant doctrinal concern.", a: 1, why: "This needs clear pastoral guidance." }
          ] },
        { t: "idea", title: "Avoid dependence without abandoning people",
          body: "The aim is to avoid unnecessary dependence without abandoning people who need genuine pastoral care.\n\nDirect involvement is sometimes necessary. The question is whether it is intentional and appropriate, or driven by unhealthy dependence." },
        { t: "reflect", title: "Intentional or habit?",
          prompt: "Think of the last time you stepped into a leader’s area. Was it intentional, or habit? What would you do differently now?",
          hint: "" },
        { t: "action", title: "Name your intervention boundaries",
          intro: "Leaders feel safer when they know where the lines are.",
          steps: [
            "Write which situations in your area call for you to step in directly.",
            "Re-read RLCC’s safeguarding procedures so you can act quickly.",
            "Share your boundaries with your lay leaders so they know what to expect."
          ],
          done: "Boundaries written, safeguarding procedures reviewed, and leaders informed." }
      ]),

      /* ---------------------------------------------------------------- 9 */
      L(9, "Leading the culture change", 7,
        "Hold yourself accountable to five expectations and change the habits that keep dependence alive.", [
        { t: "idea", title: "The hardest part is culture",
          body: "The greatest challenge is likely to be cultural, not structural.\n\nPastors may be used to showing their value by being busy. Lay leaders may be used to waiting to be told what to do. Both groups have to learn a different way of working, and the change takes patience, humility, and prayer." },
        { t: "list", title: "Five expectations for every overseeing pastor", intro: "Each comes with a question and a sign of progress.",
          items: [
            { h: "Leadership coverage", b: "Does each assigned area have an identified leader? Evidence: a designated, functioning lay leader or team." },
            { h: "Leadership development", b: "Are leaders being intentionally developed? Evidence: regular coaching, training, and developmental conversations." },
            { h: "Ministry health", b: "Are ministries healthy and fulfilling their purposes? Evidence: indicators of spiritual health, participation, care, and mission." },
            { h: "Leadership multiplication", b: "Are current leaders developing others? Evidence: emerging leaders receiving responsibility and development." },
            { h: "Accountability", b: "Do you understand progress and respond to concerns? Evidence: regular reviews, timely interventions, and appropriate reporting." }
          ],
          note: "Pastors cannot guarantee every ministry outcome. Both ministry health and the quality, consistency, and faithfulness of pastoral oversight are evaluated." },
        { t: "idea", title: "Five questions to expect",
          body: "When a ministry struggles, the senior pastor may ask the overseeing pastor:",
          points: [
            "Who is the lay leader responsible for this ministry?",
            "What have you done to equip that leader?",
            "What decisions have you empowered that leader to make?",
            "What is preventing the leader from fulfilling their responsibilities?",
            "What is your plan for developing the leader?"
          ],
          note: "These questions hold pastors accountable for oversight and development, not only for outcomes." },
        { t: "idea", title: "Modeled from the top",
          body: "The senior pastor must model the same principle. If every difficult decision must go through one person, dependency is simply reproduced at another level.\n\nCulture changes when leaders at every level let go in the same direction." },
        { t: "choice", title: "Which question leads?",
          q: "A community is struggling. Which question best reflects the oversight model?",
          opts: [
            { x: "“Why isn’t this community growing?”", fb: "It looks only at the outcome, not at who is leading or how they are being equipped." },
            { x: "“Who is the lay leader responsible, and what have I done to equip them?”", ok: true, fb: "Yes. It begins with leadership and your part in developing it." },
            { x: "“What event can we add to boost attendance?”", fb: "That is a programming reflex that routes the work back through the pastor." }
          ] },
        { t: "reflect", title: "Answer the questions honestly",
          prompt: "For the area you oversee: Who is the lay leader responsible? What have you done to equip that person? What is preventing them from leading?",
          hint: "" },
        { t: "action", title: "Self-check with the five questions",
          intro: "Do this before your next meeting with the senior pastor.",
          steps: [
            "Write your answers to the five questions for each community or ministry you oversee.",
            "Mark any area that has no identified leader.",
            "Bring your answers to your next meeting with the senior pastor."
          ],
          done: "Five questions answered for each area, with gaps identified." }
      ]),

      /* --------------------------------------------------------------- 10 */
      L(10, "Your 2027 oversight plan", 8,
        "Write a concrete plan for developing and overseeing lay leaders in 2027.", [
        { t: "list", title: "How oversight may be organized", intro: "RLCC is deciding on the structure. Here are the options.",
          items: [
            { h: "A. Portfolio-based oversight", b: "Each pastor is assigned several communities or ministries and develops their lay leaders without directly leading day-to-day operations." },
            { h: "B. Functional oversight", b: "Each pastor oversees a broader function, such as outreach, discipleship, leadership development, or pastoral care, with lay leaders leading the areas within it." },
            { h: "C. A combination of both", b: "Pastors have primary responsibility for particular functions and may also oversee specific communities, according to RLCC’s needs." }
          ],
          note: "A combination may preserve REACH, CORE, LEAD, and ADMIN while moving day-to-day leadership to capable lay leaders. Whatever the structure, the philosophy and the five expectations stay the same." },
        { t: "idea", title: "Our philosophy in one line",
          body: "Pastors equip and oversee. Lay leaders lead and multiply. The whole church participates in God’s mission.\n\nOur measure of success is not how much a pastor accomplishes personally, but how faithfully pastors equip others, how well lay leaders fulfill their responsibilities, how healthy our communities and ministries are, and how consistently new leaders are developed." },
        { t: "idea", title: "Build the plan from what you have learned",
          body: "Draw on each lesson as you write:",
          points: [
            "Name the leader for each area, and where there is none, begin to develop one.",
            "Decide which decisions you will empower leaders to make.",
            "Use coaching questions, LEAD, and a monthly review.",
            "Move routine work to leaders and track your time.",
            "Know your boundaries for stepping in."
          ] },
        { t: "reflect", title: "The biggest shift",
          prompt: "What is the single biggest shift you will make in 2027? What will you stop doing so that someone else can start?",
          hint: "" },
        { t: "action", key: "plan-2027", title: "My 2027 oversight plan",
          intro: "Write it plainly. Share it with the senior pastor and revisit it quarterly.",
          fields: [
            "The communities or ministries I oversee, and the lay leader for each",
            "My first three leadership-development steps for the first quarter",
            "What I will hand over to lay leaders, and by when"
          ],
          steps: [
            "Complete the three prompts below.",
            "Share the plan with the senior pastor.",
            "Put a quarterly check-in on your calendar."
          ],
          done: "Plan written and shared." }
      ])
    ]
  };
})();

---
title: Teaching Zotero using Documentation
date: 2026-09-11
---

## Hi!

I'm a psychology undergrad from Brazil, and a while ago I taught a short class on Zotero at an international event at UECE (Universidade Estadual do Ceará). This post is the story of how I prepared it :)


## the setup
Zotero is a free, open-source tool for organizing references, but the class was really about something else: data literacy. Naming things, keeping them findable, knowing where your stuff lives. CMS (citation management software) just happens to be a really great way to do that!

Academics have a name for this skill set: *information literacy*, searching, filtering, evaluating, organizing and actually making use of what you find.[^1] (Which seems really important in the age of LLMs.) It sounds abstract, but the reasons people never get there are very concrete: they don't know these tools exist, they think learning one takes too long, they feel they don't have enough references yet to need one, or they assume keeping the library updated will become a second job.[^2]

## docs instead of slides

To contribute a bit to this situation, I set out to discover how people were teaching Zotero. I used what I could. I participated in a really good workshop at Charité, where we were prompted to follow a series of exercises the professors had kindly prepared for us, from what the application itself is, to different ways of interacting with a text, different ways of organizing your library, saving papers and adjusting metadata.

Besides that, I had to read many papers about data literacy and teaching experiences on how to use different CMSs (citation management software).

Universities already offer these trainings in plenty of formats: asynchronous websites, YouTube videos, workshops.[^3] But format only gets you so far. What I kept circling back to is a very Freirean idea: training should aim at autonomy.[^4] Give someone material they can return to, and they leave with a practice they built themselves.

To prepare the material, I had some options to work with:
1. Slides
2. A PDF with exercises to work through
3. A Framapad: a sort of collaborative document (thanks to OLS and The Carpentries!)
4. A website, but hey, I had no experience with web development

For some reason I **really** didn't want to use slides. The goal being:

How can I make something that will keep being useful after the workshop itself? 

If someone is still learning about research organization, naming folders and documents, their workflow could probably hide any material I made. And we wouldn't have enough time at the workshop itself (an hour and a half). 

At that time I was starting to get used to Quarto, and it was my first thought for building the documentation. A really close friend, a really great web developer, was building a website for his girlfriend (also my friend); since it was a landing page + blog, he was using a framework called Astro (their focus is content-driven websites, with content written in markdown). I dabbled in Astro for a bit and got halfway through the tutorials, in the hopes of using it for a personal blog (like this one, which I ended up not using! xD). So how did I decide which one to use?

Quarto is really, really good for what it proposes to be, but the workshop wouldn't have many references (the way we're used to in papers), and the Astro templates were **really** tempting, so I decided to take the leap of faith.

Inside Astro, there is a documentation framework called Starlight. It looked very easy to use and had some built-in options that would make my life much easier! So I was set! >:)

The process of writing and organizing took 5 days; then translating it to English and Spanish took 2 or 3 more. Separating the files by language was a bit of a hassle, but it worked out well in the end. 

Besides the website, we also had a Framapad with exercises and ways to collaborate.

I also wrote a script to email every participant. Here's the email it sent:

```
Dear participant,

Thank you for signing up for our workshop on using Zotero.

For accessibility, and to make sure everyone can explore the material at their own pace, we've already made the content for Friday's session available. The site can be read in Portuguese, English, and Spanish, and you can access it in advance through this link.

Also, the Google Meet rooms are already available! You can find the link to your room in the CIPET schedule spreadsheet here.

Just a reminder: during our session, we'll use a collaborative document for the hands-on activities. Access to that document will be shared directly in the chat during the broadcast.

See you this Friday at 4 PM!

Best,
The minicurso team
```

[the script I used to send the emails is here](https://github.com/odisseuz/GmailR_Sender_Simple_Script)

## the class

Roughly 36 people showed up (100+ enrolled, about 25 stayed until the end) and the most-asked question wasn't about Zotero itself. It was: *is the site going to stay online?* I also watched people copy the Framapad into their own notes in real time, and that was satisfying. (It actually kept me from changing my GitHub username, so I wouldn't break the page!)

There were downsides as well: I had prepared for a hands-on workshop, but maybe because of my own experience (I'm new to teaching), maybe because of the differences in the academic culture we were part of (all around Brazil, Latin America and Africa), it turned out to be a very lecture-style class, with a few questions at the end. 

## what stuck with me

Teaching a tool was a really new thing to me. You only find out if you actually taught it when you watch someone try to use it. And writing the documentation forced me to be precise, and sometimes repetitive, about steps I normally do on autopilot. In the process, I also learned a lot about the tool itself, in ways I wouldn't have if I hadn't had this opportunity. (I even tried installing Zotero on every computer I could find, just to see what errors I'd get!)

The constructivist take on these tools already exists internationally.[^5] What I keep thinking about is how much of it still needs adapting to Brazilian researchers: at least in my reality, we don't have a research support department to help us out :,) maybe it's different in other contexts. 

Besides all of this, I think some older researchers might have had a hard time keeping up with the class, and how to better support this audience is something I really need to think seriously about.

## the material

If you want to see it, the whole documentation is open: [curso-zotero](https://github.com/odisseuz/curso-zotero).

[^1]: Dudziak, E. A. (2003). *Information literacy: princípios, filosofia e prática.*
[^2]: Rangaswamy, B. (2021). *Researcher's perception on Zotero and Mendeley.*; Speare, M. (2018). *Graduate student use and non-use of reference and PDF management software.*
[^3]: Ramer, R. (n.d.). [Zotero: getting started.](https://libguides.colostate.edu/zotero)
[^4]: FREIRE, Paulo. Pedagogia da autonomia: saberes necessários à prática educativa. São Paulo: Paz e Terra, 1996. (Brazilian Edition)
[^5]: Beatty, J. F. (2016). *Zotero: a tool for constructionist learning in critical information literacy.*

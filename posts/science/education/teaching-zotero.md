---
title: Teaching Zotero using Documentation
date: 2026-09-11
---

A few months ago, I got the opportunity to teach a short Zotero class at an international event at UECE. I had one strict rule for myself: I absolutely refused to use slides.

This post is the story of how I prepared for it, and why I chose to build documentation instead.

## the setup

Zotero is a free, open-source tool for organizing references, but the class was really about something else: *information literacy*. Naming things, keeping them findable, knowing where your stuff lives, and actually making use of what you find.[^1] 

Academics often fail to get there for very concrete reasons: they don't know these tools exist, they think learning one takes too long, or they assume keeping a library updated will become a second job.[^2] 

To contribute a bit to this situation, I started looking into how people were teaching Zotero. Universities offer plenty of formats: videos, PDFs, asynchronous websites.[^3] But what I kept circling back to is a very Freirean idea: training should aim at autonomy.[^4] 

If you give someone slides, they look at them once and forget. If you give them material they can return to, they leave with a practice they built themselves.

## docs instead of slides

I needed a website. At the time, I was deciding between Quarto and Astro. While Quarto is great for traditional academic publishing, I ended up taking a leap of faith with Starlight (Astro's documentation framework). It was fast, and had built-in features that made separating the site into Portuguese, English, and Spanish so much easier.

Writing the documentation forced me to be precise and sometimes repetitive about steps I normally do on autopilot. I even tried installing Zotero on every computer I could find just to see what random errors I'd get. 

To handle the logistics, I wrote a quick R script to email the 100+ enrolled participants with their links and instructions ([you can check the script here](https://github.com/odisseuz/GmailR_Sender_Simple_Script)). 

For the class itself, we relied on the docs and a Framapad (thanks to OLS and The Carpentries for the inspiration!). The idea was to use the pad as a collaborative document where we could do hands-on exercises together, like dropping papers and fixing bad metadata in real time.

## the class

Roughly 36 people showed up on the day, and about 25 stayed until the end. The most-asked question wasn't actually about Zotero itself. It was: *"is the site going to stay online?"* 

Watching people copy the Framapad into their own notes and asking about the website in real time was incredibly satisfying. (It actually kept me from changing my GitHub username later, just so I wouldn't break their bookmarks!)

There were downsides, though. Despite my preparation for a hands-on workshop, the session leaned heavily into a traditional lecture-style class. Maybe because I'm new to teaching, or maybe because of the academic culture we were part of (spanning Brazil, Latin America, and Africa), the interactivity didn't happen exactly as I planned.

## What stuck with me

Teaching a tool was a humbling experience. You only find out if you actually taught it when you watch someone try to use it .

The constructivist take on these tools already exists internationally,[^5] but I keep thinking about how much of it needs adapting to Brazilian researchers. In my reality, we don't have a research support department to help us out through the research process. 

I also noticed that some older researchers had a hard time keeping up with the interface. It made me think about that autonomy across generational gaps with technology. How to better support this audience is a challenge I still need to think seriously about.

## the material

If you want to see the result, the whole documentation is open here: [curso-zotero](https://github.com/odisseuz/curso-zotero).

[^1]: Dudziak, E. A. (2003). *Information literacy: princípios, filosofia e prática.*
[^2]: Rangaswamy, B. (2021). *Researcher's perception on Zotero and Mendeley.*; Speare, M. (2018). *Graduate student use and non-use of reference and PDF management software.*
[^3]: Ramer, R. (n.d.). [Zotero: getting started.](https://libguides.colostate.edu/zotero)
[^4]: FREIRE, Paulo. Pedagogia da autonomia: saberes necessários à prática educativa. São Paulo: Paz e Terra, 1996.
[^5]: Beatty, J. F. (2016). *Zotero: a tool for constructionist learning in critical information literacy.*

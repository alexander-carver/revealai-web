// Mock celebrity profiles for demo/showcase
// Ported from iOS app RevealAI/Mockdata/

export interface MockSource {
  url: string;
  label: string;
  image?: string; // optional image path for source preview
}

export interface MockProfile {
  id: string;
  name: string;
  aliases: string[];
  images: string[]; // paths to images
  sources: MockSource[];
  summary: string; // short description for cards
  answer: string; // full detailed answer
}

// Helper to parse sources from raw text format
function parseSources(sourcesText: string): MockSource[] {
  const sources: MockSource[] = [];
  const lines = sourcesText.split('\n').filter(line => line.trim());
  
  let currentUrl = '';
  let currentLabel = '';
  
  for (const line of lines) {
    const urlMatch = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
    const labelMatch = line.match(/- Label: (.+)/);
    
    if (urlMatch) {
      if (currentUrl && currentLabel) {
        sources.push({ url: currentUrl, label: currentLabel });
      }
      currentUrl = urlMatch[2];
      currentLabel = urlMatch[1]; // Default to link text
    } else if (labelMatch) {
      currentLabel = labelMatch[1];
    }
  }
  
  // Push last one
  if (currentUrl && currentLabel) {
    sources.push({ url: currentUrl, label: currentLabel });
  }
  
  return sources;
}

export const mockProfiles: MockProfile[] = [
  {
    id: "donald-trump",
    name: "Donald Trump",
    aliases: ["Donald J. Trump", "@realDonaldTrump", "Trump"],
    images: ["/mock/trump1.jpg", "/mock/trump2.jpg", "/mock/trump3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Donald_Trump", label: "Wikipedia" },
      { url: "https://www.donaldjtrump.com/", label: "Official site" },
      { url: "https://truthsocial.com/@realDonaldTrump", label: "Truth Social (@realDonaldTrump)" },
      { url: "https://x.com/realDonaldTrump", label: "X/Twitter (@realDonaldTrump)" },
      { url: "https://www.facebook.com/DonaldTrump", label: "Facebook" },
      { url: "https://www.instagram.com/realdonaldtrump/", label: "Instagram (@realdonaldtrump)" },
      { url: "https://www.youtube.com/@realDonaldTrump", label: "YouTube" },
      { url: "https://www.fec.gov/data/candidate/P80001571/", label: "FEC filing" },
      { url: "https://apnews.com/hub/donald-trump", label: "Major media (AP)" },
      { url: "https://www.reuters.com/world/us/donald-trump/", label: "Major media (Reuters)" },
      { url: "https://www.bbc.com/news/topics/cx1m7zg0g3gt", label: "Major media (BBC)" },
      { url: "https://www.nytimes.com/topic/person/donald-trump", label: "Major media (NYT)" },
      { url: "https://trumpwhitehouse.archives.gov/people/donald-j-trump/", label: "Government bio (.gov)" },
      { url: "https://millercenter.org/president/trump", label: "University bio (.edu)" },
      { url: "https://www.trump.com/", label: "Company page" },
      { url: "https://www.forbes.com/profile/donald-trump/", label: "Major media (Forbes)" },
      { url: "https://www.britannica.com/biography/Donald-Trump", label: "Directory/Database (Britannica)" },
      { url: "https://ballotpedia.org/Donald_Trump", label: "Directory/Database (Ballotpedia)" },
    ],
    summary: "45th President of the United States, real-estate developer and media personality.",
    answer: `Donald John Trump (born June 14, 1946, Queens, New York) is the 45th president of the United States and a real-estate developer and media personality. He studied at Fordham University (1964–1966) before transferring to the University of Pennsylvania's Wharton School, earning a B.S. in economics in 1968. He joined his family's firm, later renamed the Trump Organization, and rose to national prominence through aggressive real-estate deals, licensing his name, and extensive media exposure.

Trump's business portfolio has included marquee properties and brands such as Trump Tower (opened 1983) in Manhattan, 40 Wall Street, the Mar-a-Lago club in Palm Beach (purchased 1985), and Trump National Doral (acquired 2012). Beyond property, he became a TV fixture as host and executive producer of NBC's "The Apprentice" and "The Celebrity Apprentice" (2004–2015). He co-authored the best-selling book "The Art of the Deal" (1987). His companies have faced notable legal and regulatory actions over decades, including a $25 million settlement in the Trump University case (2016) and the court-ordered dissolution of the Trump Foundation following a New York investigation (2019).

Trump won the presidency as the Republican nominee on November 8, 2016, defeating Hillary Clinton, and served from January 20, 2017, to January 20, 2021. His administration enacted the Tax Cuts and Jobs Act (December 22, 2017), signed the bipartisan First Step Act criminal-justice reform (December 21, 2018), replaced NAFTA with the United States–Mexico–Canada Agreement (in force July 1, 2020), and brokered the Abraham Accords between Israel and several Arab states (beginning September 15, 2020). He appointed three U.S. Supreme Court justices—Neil Gorsuch, Brett Kavanaugh, and Amy Coney Barrett—shifting the Court's ideological balance.

He was impeached twice by the U.S. House of Representatives: on December 18, 2019 (abuse of power and obstruction of Congress related to Ukraine), and on January 13, 2021 (incitement of insurrection following the January 6 Capitol attack). He was acquitted by the Senate both times (February 5, 2020; February 13, 2021). After leaving office, he announced a new presidential bid on November 15, 2022. He has also faced extensive civil and criminal litigation, including state and federal indictments beginning in 2023 (which he denies) and high-profile civil judgments in 2023–2024, notably the E. Jean Carroll defamation awards and a New York civil fraud judgment that imposed substantial penalties and business restrictions.

Trump is married to Melania Trump (since 2005) and has five children: Donald Jr., Ivanka, Eric, Tiffany, and Barron. He communicates frequently via social media, especially Truth Social, and remains a central figure in U.S. politics with a populist, nationalist platform emphasizing immigration restrictions, trade protectionism, deregulation, and an "America First" foreign policy.`,
  },
  {
    id: "mrbeast",
    name: "MrBeast",
    aliases: ["Jimmy Donaldson", "@MrBeast"],
    images: ["/mock/mrbeast1.jpg", "/mock/mrbeast2.jpg", "/mock/mrbeast3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/MrBeast", label: "Wikipedia" },
      { url: "https://shopmrbeast.com/", label: "Official site" },
      { url: "https://www.instagram.com/mrbeast/", label: "Instagram (@mrbeast)" },
      { url: "https://x.com/MrBeast", label: "X/Twitter (@MrBeast)" },
      { url: "https://www.facebook.com/MrBeast", label: "Facebook" },
      { url: "https://www.youtube.com/@MrBeast", label: "YouTube" },
      { url: "https://dockets.justia.com/search?query=Beast%20Investments", label: "Court docket (Justia)" },
      { url: "https://www.theverge.com/", label: "The Verge (Major media)" },
      { url: "https://www.bloomberg.com/", label: "Bloomberg (Major media)" },
      { url: "https://www.businessinsider.com/", label: "Business Insider (Major media)" },
      { url: "https://time.com/collection/time100-creators/", label: "TIME (Major media)" },
      { url: "https://www.forbes.com/lists/top-creators/", label: "Forbes (Major media)" },
      { url: "https://apnews.com/hub/mrbeast", label: "AP News (Major media)" },
      { url: "https://ew.com/", label: "Entertainment Weekly (Major media)" },
      { url: "https://www.hollywoodreporter.com/", label: "The Hollywood Reporter (Major media)" },
      { url: "https://www.theguardian.com/", label: "The Guardian (Major media)" },
      { url: "https://www.primevideo.com/", label: "Official site" },
      { url: "https://www.beastphilanthropy.org/", label: "Official site" },
      { url: "https://feastables.com/", label: "Company page" },
    ],
    summary: "YouTube's most-subscribed creator, entrepreneur, and philanthropist.",
    answer: `MrBeast is Jimmy Donaldson (born May 7, 1998, in Wichita, Kansas), the American YouTuber and entrepreneur whose main channel became YouTube's most-subscribed on June 2, 2024, and surpassed 400 million subscribers in 2025. He popularized hyper-produced challenge videos and large-scale giveaways that routinely top 50–100M views, earning back-to-back industry honors including Streamys Creator of the Year (2020–2023), TIME100 Creators (2025), and Nickelodeon's Favorite Male Creator (2022–2025). His public social accounts include YouTube (MrBeast), Instagram (@mrbeast), X/Twitter (@MrBeast), and Facebook (MrBeast).

Beyond YouTube, Donaldson has built a sizable media and consumer-brands business. He launched the snack company Feastables in 2022 and, according to 2025 investor materials reported by Bloomberg, the brand generated ~$250M in 2024 sales with over $20M in profit, outpacing his media division. In late 2024 he premiered Beast Games on Prime Video, a mega-scale reality competition that drew ~50M viewers within 25 days; Amazon renewed it for two more seasons, and Season 1 ultimately awarded a record $10M to the winner after a final twist. He previously co-created the ghost-kitchen venture MrBeast Burger (2020) and later sued partner Virtual Dining Concepts over quality and trademark issues; an appellate ruling in 2025 allowed his claims to proceed.

Philanthropy is central to his public persona. He operates Beast Philanthropy, a 501(c)(3) and YouTube channel funding projects like large-scale food distribution, international medical care, and housing builds. He has also fronted viral fundraisers such as #TeamTrees and #TeamSeas, and in 2025 promoted high-dollar donor weekends at his North Carolina studios to finance expanded charitable work.

Controversies have accompanied the scale. Beast Games drew a 2024 lawsuit from several contestants alleging mistreatment (claims he and Amazon have disputed publicly), and critics in outlets like The Guardian have questioned whether his spectacle-driven altruism veers into "charity as content." Those debates sit alongside mainstream recognition and unprecedented audience reach.`,
  },
  {
    id: "jeffrey-epstein",
    name: "Jeffrey Epstein",
    aliases: ["Jeffery Epstein"],
    images: ["/mock/jefferyepstein1.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Jeffrey_Epstein", label: "Wikipedia" },
      { url: "https://www.nytimes.com/2019/08/10/nyregion/jeffrey-epstein-dead.html", label: "Obituary (NYT)" },
      { url: "https://www.justice.gov/usao-sdny/pr/jeffrey-epstein-charged-sex-trafficking-minors", label: "DOJ press release" },
      { url: "https://www.courtlistener.com/docket/15990930/united-states-v-epstein/", label: "Court filing (DOJ)" },
      { url: "https://www.miamiherald.com/news/local/article220097825.html", label: "Major media (Miami Herald)" },
      { url: "https://www.bbc.com/news/world-us-canada-49320324", label: "Major media (BBC)" },
      { url: "https://apnews.com/hub/jeffrey-epstein", label: "Major media (AP)" },
      { url: "https://www.vanityfair.com/news/2003/03/jeffrey-epstein-200303", label: "Major media (Vanity Fair)" },
      { url: "https://www.pbs.org/newshour/nation/key-facts-about-the-jeffrey-epstein-case", label: "Major media (PBS)" },
      { url: "https://offender.fdle.state.fl.us/offender/sops/home.jsf", label: "Government registry (.gov)" },
      { url: "https://www.britannica.com/biography/Jeffrey-Epstein", label: "Directory/Database (Britannica)" },
      { url: "https://www.biography.com/crime/jeffrey-epstein", label: "Directory/Database (Biography.com)" },
    ],
    summary: "American financier and convicted sex offender (1953–2019).",
    answer: `This profile covers Jeffrey Edward Epstein (born January 20, 1953, Brooklyn, New York; died August 10, 2019, New York City), an American financier and convicted sex offender whose wealth, social access, and criminal cases drew sustained global attention. He began his career teaching at the Dalton School in the mid-1970s, moved to Bear Stearns, and left in 1981 as an options trader/limited partner. In 1982 he founded his own money-management firm, commonly referred to as J. Epstein & Co., claiming to serve ultra-high-net-worth clients; retail magnate Leslie Wexner is the client most publicly documented and central to Epstein's accumulation of assets and real estate.

Epstein's first criminal case culminated in a June 2008 Florida plea, when he admitted to state charges of procuring a person under 18 for prostitution and solicitation; he received a 13-month county sentence with work-release and was required to register as a sex offender. That outcome arose from a 2007 federal non-prosecution agreement negotiated by the U.S. Attorney's Office in Miami under Alexander Acosta and was later condemned in federal court for violating victims' rights, helping catalyze renewed scrutiny.

On July 6–8, 2019 he was arrested and federally indicted in the Southern District of New York for sex trafficking of minors, accused of running a years-long scheme that recruited and abused underage girls in New York and Florida. A federal judge denied bail on July 18, 2019. Epstein was found unresponsive in his cell at the Metropolitan Correctional Center on August 10, 2019; the New York City medical examiner ruled the death a suicide by hanging. Procedural failures at the jail and Epstein's connections to powerful people fueled intense public controversy and conspiracy theories; official investigations faulted security lapses, and two guards later faced charges over falsified logs, but no criminal conspiracy was established.

After his death, litigation and settlements continued. The Epstein estate created a voluntary compensation fund that paid sizable sums to more than a hundred claimants, and civil suits targeted associates and institutions alleged to have enabled the abuse. Ghislaine Maxwell—long described as Epstein's associate—was arrested in 2020, convicted in December 2021 on federal sex-trafficking charges, and sentenced in 2022. Epstein's properties in New York, Florida, New Mexico, and the U.S. Virgin Islands were liquidated to fund the estate and settlements.`,
  },
  {
    id: "elon-musk",
    name: "Elon Musk",
    aliases: ["@elonmusk"],
    images: ["/mock/elonmusk2.jpg", "/mock/elonmusk3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Elon_Musk", label: "Wikipedia" },
      { url: "https://x.com/elonmusk", label: "X/Twitter (@elonmusk)" },
      { url: "https://www.nytimes.com/topic/person/elon-musk", label: "Major media (NYT)" },
      { url: "https://www.wsj.com/topics/people/elon-musk", label: "Major media (WSJ)" },
      { url: "https://www.bbc.com/news/topics/cp7r8vglny7t/elon-musk", label: "Major media (BBC)" },
      { url: "https://apnews.com/hub/elon-musk", label: "Major media (AP)" },
      { url: "https://www.bloomberg.com/billionaires/", label: "Major media (Bloomberg)" },
      { url: "https://www.forbes.com/profile/elon-musk/", label: "Major media (Forbes)" },
      { url: "https://www.tesla.com/", label: "Company page" },
      { url: "https://www.spacex.com/", label: "Company page" },
      { url: "https://neuralink.com/", label: "Company page" },
      { url: "https://www.boringcompany.com/", label: "Company page" },
      { url: "https://x.ai/", label: "Company page" },
      { url: "https://www.britannica.com/biography/Elon-Musk", label: "Directory/Database (Britannica)" },
      { url: "https://www.crunchbase.com/person/elon-musk", label: "Directory/Database (Crunchbase)" },
      { url: "https://www.imdb.com/name/nm1907769/", label: "Directory/Database (IMDb)" },
    ],
    summary: "CEO of Tesla and SpaceX, owner of X (formerly Twitter).",
    answer: `Elon Reeve Musk (born June 28, 1971, Pretoria, South Africa) is a technology entrepreneur and industrialist who leads multiple companies spanning electric vehicles, reusable rockets, satellite communications, tunneling, and artificial intelligence. He holds South African, Canadian, and U.S. citizenships. This profile covers the best-known "Elon Musk," the CEO/lead of Tesla and SpaceX whose public activity and media coverage dwarf any namesakes.

Musk co-founded the web-software firm Zip2 in 1995 and sold it to Compaq in 1999. That year he launched the online financial services company X.com, which merged with Confinity to become PayPal; eBay acquired PayPal in 2002. In 2002 he founded SpaceX to reduce launch costs and enable human settlement of Mars. He led development of Falcon rockets, the Dragon spacecraft, and Starlink, a global satellite-internet network. In May 2020 SpaceX's Crew Dragon became the first commercially built and operated spacecraft to carry astronauts to orbit, and in the 2020s the company began testing Starship, a fully reusable, heavy-lift system designed for lunar and Mars missions.

At Tesla, Musk joined as an early investor in 2004, became product architect, and assumed the CEO role by 2008. He oversaw the Roadster, Model S, Model X, Model 3, and Model Y; large-scale battery storage (Powerwall/Powerpack/Megapack); and an autonomous-driving stack marketed as Autopilot and Full Self-Driving. He has also chaired or founded other ventures: SolarCity (founded 2006, acquired by Tesla in 2016), The Boring Company (2016) for tunneling and loop projects, Neuralink (2016) for brain-computer interfaces, and xAI (2023) to develop frontier artificial intelligence models.

Musk acquired Twitter on October 27, 2022 and rebranded it as X in 2023, positioning the platform as an "everything app." He is one of the world's wealthiest individuals, with fortune swings tied mainly to Tesla and SpaceX valuations. His Musk Foundation focuses on science and engineering education, clean energy, pediatric research, and space-exploration causes. He maintains an exceptionally active public presence under @elonmusk on X, where his posts regularly drive news cycles and move markets.`,
  },
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    aliases: ["@DUALIPA"],
    images: ["/mock/dualipa1.jpg", "/mock/dualipa2.jpg", "/mock/dualipa3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Dua_Lipa", label: "Wikipedia" },
      { url: "https://www.dualipa.com/", label: "Official site" },
      { url: "https://www.instagram.com/dualipa/", label: "Instagram (@dualipa)" },
      { url: "https://x.com/DUALIPA", label: "X/Twitter (@DUALIPA)" },
      { url: "https://www.facebook.com/DuaLipa", label: "Facebook" },
      { url: "https://www.youtube.com/@dualipa", label: "YouTube" },
      { url: "https://president.al/", label: "Government (.gov)" },
      { url: "https://president-ksgov.net/", label: "Government (.gov)" },
      { url: "https://www.reuters.com/world/uk/", label: "Major media (Reuters)" },
      { url: "https://www.brits.co.uk/winners", label: "Awards (BRITs)" },
      { url: "https://www.grammy.com/artists/dua-lipa/245804", label: "Major media (GRAMMY/Recording Academy)" },
      { url: "https://www.billboard.com/music/music-news/dua-lipa-honorary-ambassador-kosovo-1235124682/", label: "Major media (Billboard)" },
      { url: "https://www.bbc.co.uk/glastonbury", label: "Major media (BBC)" },
      { url: "https://www.officialcharts.com/artist/48966/dua-lipa/", label: "Directory/Database (Official Charts)" },
      { url: "https://www.allmusic.com/artist/dua-lipa-mn0003392041/biography", label: "Directory/Database (AllMusic)" },
      { url: "https://pitchfork.com/artists/33419-dua-lipa/", label: "Major media (Pitchfork)" },
    ],
    summary: "Albanian-British pop singer-songwriter with 3 Grammy wins.",
    answer: `Dua Lipa (born 22 August 1995 in London) is an Albanian-British pop singer-songwriter and entrepreneur whose sleek, disco-inflected hits made her one of the defining voices of late-2010s and 2020s mainstream pop. She signed to Warner in 2015 and broke out with "New Rules" (2017) from her self-titled debut album, then leveled up with Future Nostalgia (2020), a critically praised, front-to-back dance record that reset radio with singles like "Don't Start Now," "Physical" and "Levitating." She has three GRAMMY wins (Best New Artist and Best Dance Recording, 2019; Best Pop Vocal Album, 2021) and seven BRIT Awards, including Pop Act in 2024. In 2024 she headlined Glastonbury's Pyramid Stage, a career-marker performance underscoring her stadium status. Public socials include Instagram and X under @dualipa and @DUALIPA respectively.

Her third studio album, Radical Optimism (May 3, 2024), opened at No. 1 in the UK and spun off "Houdini," "Training Season" and "Illusion," keeping her run of precision-tooled dance-pop intact. Parallel to music, she acts: a cameo as Mermaid Barbie and the global hit "Dance the Night" for Barbie (2023), then a featured role in Matthew Vaughn's spy caper Argylle (2024). She also built media and community ventures around her curatorial brand Service95 (newsletter, book club, podcast), and has become a fashion power collaborator—co-designing Versace's "La Vacanza" collection (2023) and serving as a YSL Beauty global ambassador (Libre fragrance since 2019; expanded to makeup in 2024).

Rooted in Kosovar-Albanian heritage, Lipa has turned her platform toward cultural advocacy. She co-founded the Sunny Hill Foundation and Sunny Hill Festival with her father to support arts and youth in Kosovo. She was named Honorary Ambassador of the Republic of Kosovo on 5 August 2022 and received Albanian citizenship on 27 November 2022, formalizing a long-standing, public link between her global career and the region's cultural life.`,
  },
  {
    id: "andrew-tate",
    name: "Andrew Tate",
    aliases: ["Emory Andrew Tate III", "@Cobratate"],
    images: ["/mock/andrewtate1.jpg", "/mock/andrewtate2.jpg", "/mock/andrewtate3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Andrew_Tate", label: "Wikipedia" },
      { url: "https://www.cobratate.com/", label: "Official site" },
      { url: "https://x.com/Cobratate", label: "X/Twitter (@Cobratate)" },
      { url: "https://rumble.com/c/TateSpeech", label: "Rumble" },
      { url: "https://www.reuters.com/", label: "Reuters" },
      { url: "https://apnews.com/hub/andrew-tate", label: "AP" },
      { url: "https://www.theguardian.com/world/andrew-tate", label: "The Guardian" },
      { url: "https://www.pbs.org/newshour/tag/andrew-tate", label: "PBS" },
      { url: "https://www.voanews.com/", label: "VOA News" },
      { url: "https://www.rferl.org/", label: "RFE/RL" },
    ],
    summary: "British-American former kickboxer and controversial online personality.",
    answer: `This profile covers Emory Andrew Tate III (born December 1, 1986), the British-American former professional kickboxer turned online personality and entrepreneur. Raised in the U.K. after being born in Washington, D.C., he is the son of the late chess International Master Emory Tate and the brother of Tristan Tate. Tate won multiple ISKA full-contact kickboxing titles in the early 2010s, then crossed into reality TV on Big Brother UK (2016), from which he was removed after external controversy.

After retiring from competition, Tate built a high-visibility brand promoting hyper-masculine self-help and wealth-building advice. He markets paid communities and courses—most notably Hustler's University (later relaunched as The Real World)—alongside a private network known as The War Room. His commentary drew bans from major platforms in August 2022 for policy violations; his account on X (formerly Twitter) was later reinstated. He now concentrates distribution on channels he controls, including his official site, his X account, and a verified Rumble channel.

Legal scrutiny has dominated his public life since late 2022. Romanian authorities arrested Tate on December 29, 2022; he cycled through detention, house arrest, and judicial control while prosecutors developed cases. He and his brother were indicted on June 20, 2023 on charges including human trafficking, rape, and forming an organized criminal group; significant assets were seized during the probe. In 2024–2025, appellate rulings faulted parts of the prosecution's filing and excluded elements of evidence, sending the case back for correction even as judicial restrictions were adjusted multiple times. Separately, U.K. civil proceedings alleging abuse are scheduled for trial in 2027. Tate denies all allegations and portrays the actions against him as politically motivated.

Online, Tate positions himself as a motivational mogul—"Top G"—promoting discipline, wealth, and status symbols. Supporters credit him with entrepreneurship and personal development advice; critics, including educators and advocacy groups, argue his content amplifies misogyny and harms boys and young men.`,
  },
  {
    id: "taylor-swift",
    name: "Taylor Swift",
    aliases: ["@taylorswift13"],
    images: ["/mock/taylorswift1.jpg", "/mock/taylorswift2.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/Taylor_Swift", label: "Wikipedia" },
      { url: "https://www.taylorswift.com/", label: "Official site" },
      { url: "https://www.instagram.com/taylorswift/", label: "Instagram (@taylorswift)" },
      { url: "https://x.com/taylorswift13", label: "X/Twitter (@taylorswift13)" },
      { url: "https://www.facebook.com/TaylorSwift", label: "Facebook" },
      { url: "https://www.youtube.com/@TaylorSwift", label: "YouTube" },
      { url: "https://apnews.com/hub/taylor-swift", label: "Major media (AP)" },
      { url: "https://www.reuters.com/world/", label: "Major media (Reuters)" },
      { url: "https://www.forbes.com/profile/taylor-swift/", label: "Major media (Forbes)" },
      { url: "https://www.bloomberg.com/", label: "Major media (Bloomberg)" },
      { url: "https://pitchfork.com/", label: "Major media (Pitchfork)" },
      { url: "https://people.com/", label: "Major media (People)" },
      { url: "https://www.billboard.com/artist/taylor-swift/", label: "Major media (Billboard)" },
      { url: "https://www.grammy.com/", label: "Company page" },
      { url: "https://www.universalmusic.com/", label: "Company page" },
      { url: "https://www.pollstar.com/", label: "Directory/Database (Pollstar)" },
    ],
    summary: "Record-breaking singer-songwriter with 14 Grammy wins and highest-grossing tour ever.",
    answer: `This profile covers Taylor Alison Swift (born December 13, 1989, West Reading, Pennsylvania), the American singer-songwriter whose autobiographical writing and genre-hopping reinventions made her one of the best-selling and most influential artists of the 21st century. She signed to Big Machine in 2005 and debuted with Taylor Swift (2006), then broke through globally with Fearless (2008)—the first of four albums that would later win the GRAMMY for Album of the Year. Early country-pop hits like "Love Story" and "You Belong With Me" set up a decade-long run at or near the center of popular culture.

Across the 2010s she expanded from country to mainstream pop: Speak Now (2010), Red (2012), the pivot-defining 1989 (2014), the darker, maximalist Reputation (2017), and the pastel pop of Lover (2019). In 2020 she surprised with the indie-leaning folklore and evermore. Midnights (2022) restored her blockbuster pop status and made Swift the first artist ever to win four Album of the Year GRAMMYs (for Fearless, 1989, folklore, Midnights), bringing her career total to 14 GRAMMY Awards. TIME named her Person of the Year in 2023.

In 2023–24 her Eras Tour became the highest-grossing tour in history, eclipsing $2 billion in ticket sales and spawning the top-grossing concert film ever; a capstone concert film and six-part docuseries arrive on Disney+ in December 2025. She followed 2024's The Tortured Poets Department with her 12th studio album, The Life of a Showgirl (Oct. 3, 2025), which set U.S. first-week records and gave her a 15th No. 1 on the Billboard 200.

Swift's most consequential business story has been ownership. After her early masters were sold without her consent, she began re-recording her first six albums as "Taylor's Version," then purchased the original masters from Shamrock Capital in May 2025—regaining control of her full catalog while proving unprecedented leverage for artist rights at her scale.`,
  },
  {
    id: "lebron-james",
    name: "LeBron James",
    aliases: ["Lebron James", "@KingJames"],
    images: ["/mock/lebronjames1.jpg", "/mock/lebronjames2.jpg", "/mock/lebronjames3.jpg"],
    sources: [
      { url: "https://en.wikipedia.org/wiki/LeBron_James", label: "Wikipedia" },
      { url: "https://www.lebronjames.com/", label: "Official site" },
      { url: "https://www.instagram.com/kingjames/", label: "Instagram (@kingjames)" },
      { url: "https://x.com/KingJames", label: "X/Twitter (@KingJames)" },
      { url: "https://www.facebook.com/LeBron", label: "Facebook" },
      { url: "https://www.nba.com/player/2544/lebron-james", label: "Company page" },
      { url: "https://www.espn.com/nba/player/_/id/1966/lebron-james", label: "Major media (ESPN)" },
      { url: "https://olympics.com/en/athletes/lebron-james", label: "Olympics (official)" },
      { url: "https://www.reuters.com/world/", label: "Major media (Reuters)" },
      { url: "https://www.washingtonpost.com/sports/2019/10/15/lebron-james-china-nba-daryl-morey/", label: "Major media (Washington Post)" },
      { url: "https://www.lebronjamesfamilyfoundation.org/", label: "Official site" },
      { url: "https://www.akronschools.com/schools/i_promise_school", label: "School (district site)" },
      { url: "https://www.youtube.com/@UNINTERRUPTED", label: "YouTube" },
      { url: "https://www.springhillcompany.com/", label: "Company page" },
      { url: "https://news.nike.com/news/nike-signs-lebron-james-to-lifetime-agreement", label: "Official site" },
      { url: "https://www.forbes.com/sites/mikeozanian/2022/06/02/lebron-james-is-officially-a-billionaire/", label: "Major media (Forbes)" },
      { url: "https://www.bloomberg.com/news/articles/2021-03-16/lebron-james-becomes-part-owner-of-boston-red-sox", label: "Major media (Bloomberg)" },
    ],
    summary: "NBA's all-time leading scorer, 4x champion, and sports/media mogul.",
    answer: `LeBron Raymone James Sr. (born December 30, 1984, Akron, Ohio) is an American professional basketball player for the Los Angeles Lakers and the NBA's all-time leading scorer. A 6-foot-9 forward drafted No. 1 overall in 2003 out of St. Vincent–St. Mary High School, he has won four NBA championships (2012, 2013, 2016, 2020), four Finals MVPs, and four regular-season MVPs, and has been selected to a record number of All-Star and All-NBA teams. He passed Kareem Abdul-Jabbar to become the league's career scoring leader on February 7, 2023, and became the first player to reach 40,000 points in March 2024. In 2023 he also lifted the inaugural NBA Cup and was named the tournament's MVP.

His career arc spans three franchises. He debuted with the Cleveland Cavaliers (2003–2010), then announced a move to the Miami Heat in the 2010 ESPN special "The Decision," winning two titles in four Finals trips (2010–2014). Returning to Cleveland, he led the Cavaliers to the 2016 championship, overturning a 3–1 Finals deficit to defeat the 73-win Warriors—one of the defining achievements of his era (2014–2018). He joined the Lakers in 2018, won the 2020 title in the Orlando "bubble," and remains a high-impact two-way playmaker and scorer deep into his 40s.

Internationally, James owns three Olympic gold medals (2008 Beijing, 2012 London, 2024 Paris) and one bronze (2004 Athens), serving as a playmaking hub for Team USA and returning in 2024 as part of the veteran-laden squad that reclaimed gold. His FIBA résumé also includes a 2006 World Cup bronze. His global profile is amplified by massive social followings on Instagram and X, where he engages directly with fans and culture.

Off the court, James is a major entrepreneur and producer. He co-founded The SpringHill Company and UNINTERRUPTED (home of "The Shop"), holds a lifetime endorsement deal with Nike, and has investments spanning Blaze Pizza to spirits; he became a partner in Fenway Sports Group, linking him to the Boston Red Sox and Liverpool FC. Through the LeBron James Family Foundation he opened the I PROMISE School in partnership with Akron Public Schools and built out community initiatives like House Three Thirty.`,
  },
];

// Emma Smith - Demo profile for anyone to search (Denver, CO)
export const emmaSmithProfile: MockProfile = {
  id: "emma-smith",
  name: "Emma Smith",
  aliases: ["Emma R. Smith", "Emma Rose Smith", "@emmasmith_denver"],
  images: ["/emma-2.png", "/emma-1.png", "/emma-3.png", "/emma-4.png"], // surfboard first, braces last
  sources: [
    { url: "https://www.instagram.com/emmasmith_co", label: "Instagram (@emmasmith_co)", image: "/sources/source-2.png" },
    { url: "https://www.tinder.com/@emmasmith92", label: "Tinder Profile", image: "/sources/source-5.png" },
    { url: "https://twitter.com/emmasmith_denver", label: "X/Twitter (@emmasmith_denver)" },
    { url: "https://www.linkedin.com/in/emmasmith-denver", label: "LinkedIn" },
    { url: "https://www.facebook.com/emma.smith.denver", label: "Facebook" },
    { url: "https://bumble.com/profile/emmasmith", label: "Bumble Profile" },
    { url: "https://hinge.co/emmasmith92", label: "Hinge Profile" },
    { url: "https://www.pinterest.com/emmasmithco/", label: "Pinterest" },
    { url: "https://venmo.com/emmasmith92", label: "Venmo" },
    { url: "https://www.spokeo.com/Emma-Smith-Denver-CO", label: "Spokeo" },
    { url: "https://www.whitepages.com/name/Emma-Smith/Denver-CO", label: "Whitepages" },
    { url: "https://www.beenverified.com/people/emma-smith/", label: "BeenVerified" },
  ],
  summary: "Marketing professional based in Denver, Colorado. Active on social media and dating platforms.",
  answer: `Emma Rose Smith (born March 15, 1992) is a marketing professional currently residing in Denver, Colorado. She graduated from the University of Colorado Boulder in 2014 with a Bachelor's degree in Marketing and Communications.

**Professional Background**
Emma works as a Senior Marketing Manager at a Denver-based tech startup, where she has been employed since 2019. Prior to this, she worked at several marketing agencies in the Denver metro area. Her LinkedIn profile shows over 500 connections and regular professional activity.

**Social Media Presence**
Emma maintains active profiles across multiple social platforms:
- Instagram: @emmasmith_co (approximately 2,400 followers) - Posts primarily feature hiking in the Colorado Rockies, brunch spots in Denver, and travel photography
- Twitter/X: @emmasmith_denver - Occasional posts about marketing trends and local Denver events
- Facebook: Active profile with privacy settings enabled for most content
- Pinterest: Boards related to home decor, recipes, and travel destinations

**Dating App Profiles**
Multiple dating profiles were found linked to this individual:
- Tinder: Active profile mentioning love for hiking, craft beer, and dogs
- Bumble: Profile indicates looking for a relationship, mentions being a "plant mom"
- Hinge: Profile mentions favorite Denver date spots and outdoor activities

**Residence Information**
Current address appears to be in the Capitol Hill neighborhood of Denver, CO 80203. Property records indicate she has been renting at this location since 2021.

**Additional Information**
- Vehicle: 2021 Subaru Outback registered in Colorado
- No criminal records found in Colorado state database
- Member of several Denver-area hiking and outdoor recreation groups
- Frequent visitor to local coffee shops and restaurants in the RiNo and LoDo districts

**Public Records Summary**
- No bankruptcies on file
- No civil court cases found
- Clean driving record in Colorado
- Voter registration: Active, registered in Denver County`,
};

// Lookup function similar to iOS MockRegistry
export function lookupMockProfile(name: string): MockProfile | null {
  const normalized = name.toLowerCase().trim();
  
  return mockProfiles.find(profile => {
    if (profile.name.toLowerCase() === normalized) return true;
    return profile.aliases.some(alias => alias.toLowerCase() === normalized);
  }) || null;
}

// Check if a name matches any mock profile
export function isMockName(name: string): boolean {
  return lookupMockProfile(name) !== null;
}

// Enhanced lookup that also checks Emma Smith with location matching
export function lookupMockProfileByDetails(
  firstName: string, 
  lastName: string, 
  city?: string, 
  state?: string
): MockProfile | null {
  const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
  
  // Check Emma Smith specifically - available to everyone with matching location
  if (fullName === "emma smith") {
    const cityMatch = !city || city.toLowerCase().includes("denver");
    const stateMatch = !state || state.toLowerCase() === "co" || state.toLowerCase() === "colorado";
    if (cityMatch && stateMatch) {
      return emmaSmithProfile;
    }
  }
  
  // Fall back to regular mock lookup
  return lookupMockProfile(fullName);
}

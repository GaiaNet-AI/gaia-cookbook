# Location-Aware AI Agents

A comprehensive collection of location-aware AI agents leveraging local AI models through Gaia Nodes, specialized location intelligence services, and real-time web data.



## 📁 Project Structure

```
location-aware-agents/
├── 01-basic-example.py          # Basic location agent with Gaia + Tavily
├── 02-advanced-example.py       # Advanced multi-AI agent with Gaia + Camino + Tavily
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── README.md                   # This file
```

## 🚀 Quick Start

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd location-aware-agents
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Basic Example

Run the simple location-aware agent:
```bash
python 01-basic-example.py
```

<img width="1815" height="2180" alt="mermaid-diagram-2025-09-09-092638" src="https://github.com/user-attachments/assets/8a16338a-a0e2-4c80-ab7f-f689ccd8f8d5" />

#### Example Response

```
🔍 Query: What are the best coffee shops in Paris?
==================================================
Response: **Summary**:  
Paris is renowned for its charming cafes and coffee shops, which often serve as cultural hubs. These establishments range from historic patisseries to modern, minimalist spots. The best coffee shops in Paris offer a unique blend of French tradition, artisanal coffee, and cozy atmospheres.

---

### **Top Recommendations**

1. **Le Comptoir de la Gastronomie**  
   - **Address**: 37 Rue Duvaleur, 75001 Paris  
   - **Details**: A beloved spot in the Montmartre district, this café is famous for its warm ambiance and traditional French coffee. It has been a favorite among locals and visitors for decades. The menu includes classic items like croissants and pastries, alongside a selection of coffees.  
   - **Citations**: Gaia location_search + internet_search (Google Reviews)

2. **Café de l’Escargot**  
   - **Address**: 43 Rue du Faubourg Saint-Honoré, 75001 Paris  
   - **Details**: A historic café in the heart of Paris, known for its elegant decor and excellent coffee. It also serves a variety of French pastries and light meals. The atmosphere is both refined and welcoming.  
   - **Citations**: Gaia location_search + internet_search (Google Reviews)

3. **La Maison de la Café**  
   - **Address**: 112 Rue de Rivoli, 75001 Paris  
   - **Details**: This modern café combines French charm with contemporary coffee-making techniques. It offers a range of specialty coffees and has an open kitchen where you can watch the baristas craft your drink. The ambiance is relaxed and inviting.  
   - **Citations**: Gaia location_search + internet_search (Google Reviews)

4. **Café de l’Espresso**  
   - **Address**: 73 Rue du Faubourg Saint-Honoré, 75001 Paris  
   - **Details**: A stylish spot that focuses on high-quality espresso and cappuccinos. It has a minimalist design and is popular among both locals and tourists. The menu also includes a variety of pastries and light snacks.  
   - **Citations**: Gaia location_search + internet_search (Google Reviews)

5. **Le Patisserie du Soleil**  
   - **Address**: 20 Rue de Douai, 75001 Paris  
   - **Details**: While primarily a patisserie, this shop also serves excellent coffee and pastries. It is known for its beautiful decor and the quality of its baked goods. The café has a cozy, family-friendly atmosphere.  
   - **Citations**: Gaia location_search + internet_search (Google Reviews)

---

### **Insights**  
- Many of the top coffee shops in Paris are located in historic or culturally significant areas, such as Montmartre and the Champs-Élysées.  
- These cafes often serve as meeting places for locals and tourists alike, blending traditional French culture with modern comforts.  
- The quality of coffee and pastries is a key factor in choosing these spots, with many emphasizing artisanal ingredients and skilled baristas.

---

### **Practical Tips**  
- **Opening Hours**: Most cafes in Paris are open from 7:00 AM to 8:00 PM, though some may have slightly different hours.  
- **Reservations**: While not always required, it is advisable to make a reservation at popular spots during peak hours (e.g., weekends or holidays).  
- **Pricing**: A coffee typically ranges from €3 to €6, while pastries can range from €2 to €5 depending on the item.  
- **Transportation**: Many of these cafes are accessible via the metro and bus system. Use the journey_planning tool to find the best routes to each location.

---

**Todos Completed**:  
- Used Gaia location_search to find top coffee shops in Paris.  
- Conducted internet_search for additional details, reviews, and context on each cafe.  
- Synthesized findings into a structured response with actionable insights.  
- Provided recommendations based on quality, ambiance, and cultural significance.

--------------------------------------------------

🔍 Query: Find family-friendly restaurants near Golden Gate Bridge
==================================================
Response: **Summary**:  
I am researching family-friendly restaurants near the Golden Gate Bridge to provide recommendations for a memorable dining experience. The search will focus on places that are welcoming to families, have child-friendly amenities, and offer a scenic view of the bridge or surrounding area.

---

**Top Recommendations**:

1. **The Ritz-Carlton Residences, San Francisco**  
   - **Address**: 245 The Embarcadero, San Francisco, CA 94111  
   - **Why it's family-friendly**: This upscale hotel offers a fine dining experience with a focus on quality and ambiance. It has a private terrace overlooking the Golden Gate Bridge, making it ideal for families who want to enjoy the view while dining. The restaurant also has child-friendly amenities like high chairs and a kids’ menu.  
   - **Cuisine**: Modern American  
   - **Reservations**: Highly recommended to book in advance, especially during peak times.  

2. **The Bridge at the Golden Gate**  
   - **Address**: 450 Mission St, San Francisco, CA 94103  
   - **Why it's family-friendly**: This restaurant is located right on the water’s edge and offers breathtaking views of the Golden Gate Bridge. It serves contemporary American cuisine with a focus on fresh, local ingredients. The restaurant has a spacious, open layout that is ideal for families.  
   - **Cuisine**: Contemporary American  
   - **Reservations**: Required; book online through their website or via a third-party platform like OpenTable.  

3. **Sushi Saito**  
   - **Address**: 165 Mission St, San Francisco, CA 94103  
   - **Why it's family-friendly**: This sushi restaurant is known for its excellent quality and friendly service. It has a welcoming atmosphere and offers a kids’ menu with options like fish balls and tempura. The location is close to the Golden Gate Bridge, making it convenient for families who want to enjoy both dining and scenic views.  
   - **Cuisine**: Japanese  
   - **Reservations**: Recommended to book in advance, especially on weekends.  

4. **The Boulud**  
   - **Address**: 285 Mission St, San Francisco, CA 94103  
   - **Why it's family-friendly**: This upscale French restaurant is known for its exceptional service and menu. It has a large, open dining room that is ideal for families. The restaurant also offers a kids’ menu with a variety of options that cater to different tastes.  
   - **Cuisine**: French  
   - **Reservations**: Required; book online through their website or via a third-party platform like OpenTable.  

5. **The Dungeness**  
   - **Address**: 468 Mission St, San Francisco, CA 94103  
   - **Why it's family-friendly**: This restaurant is known for its fresh seafood and creative cocktails. It has a casual, modern atmosphere that is ideal for families. The menu includes a variety of options that cater to different tastes, including a kids’ menu with options like mini burgers and seafood skewers.  
   - **Cuisine**: Seafood  
   - **Reservations**: Recommended to book in advance, especially on weekends.  

---

**Insights**:  
- Many of the top-rated restaurants near the Golden Gate Bridge are located along the Embarcadero or Mission Street, which offer easy access to the bridge and a great view.  
- Family-friendly options tend to be more expensive than casual dining spots, but they often provide excellent service, ambiance, and a memorable experience for families.  
- Reservations are highly recommended at most of these restaurants, especially during peak times like weekends or holidays.

---

**Practical Tips**:  
- **Hours**: Most restaurants near the Golden Gate Bridge operate from 11:00 AM to 10:00 PM, but it's best to confirm with each restaurant.  
- **Pricing**: Expect to pay between $30 and $60 per person for a meal at a family-friendly restaurant in this area.  
- **Reservations**: Book in advance through the restaurant’s website or via third-party platforms like OpenTable.  
- **Transportation**: The Golden Gate Bridge is easily accessible by car, bus, or ferry. Consider arriving early to avoid crowds and ensure a pleasant dining experience.

--------------------------------------------------

🔍 Query: Research the startup ecosystem around MIT
==================================================
Response: **Summary**:  
The startup ecosystem around MIT is vibrant, diverse, and highly innovative. MIT itself is a hub for entrepreneurial activity, with its Media Lab, Sloan School of Management, and the MIT Entrepreneurship Center fostering a culture of innovation. The surrounding areas, including Cambridge, Boston, and the Route 128 corridor, are filled with startups, venture capital firms, incubators, and accelerators that support technology-driven businesses. This ecosystem is particularly strong in fields such as artificial intelligence, biotechnology, clean energy, and fintech.

**Top Recommendations**:  
1. **MIT Media Lab**  
   - **Location**: 545 Technology Square, Cambridge, MA  
   - **Details**: A research lab that explores the impact of technology on society. It’s home to many startups and is a key player in innovation.  
   - **Insights**: The Media Lab often collaborates with industry leaders and provides resources for entrepreneurs.  

2. **MIT Entrepreneurship Center**  
   - **Location**: 77 Massachusetts Avenue, Cambridge, MA  
   - **Details**: Offers programs like the MIT Entrepreneurship Conference and the MIT Innovation Initiative to support startup founders.  
   - **Insights**: The center helps students and alumni launch ventures through mentorship, funding opportunities, and networking events.  

3. **The MIT Sloan Executive Education**  
   - **Location**: 50 Memorial Drive, Cambridge, MA  
   - **Details**: Provides executive education programs that help entrepreneurs refine their business strategies and leadership skills.  
   - **Insights**: Ideal for experienced entrepreneurs looking to scale their companies or transition into entrepreneurship.  

4. **Cambridge Innovation Center (CIC)**  
   - **Location**: 100 Wilder Street, Cambridge, MA  
   - **Details**: A co-working space that houses over 250 startups and is a hub for innovation in the region.  
   - **Insights**: The CIC supports startups with networking opportunities, mentorship, and access to investors.  

5. **Massachusetts Institute of Technology Innovation Initiative (MIT II)**  
   - **Location**: MIT campus, Cambridge, MA  
   - **Details**: A program that helps students turn academic research into commercial products. It includes incubator support, funding, and business development resources.  
   - **Insights**: MIT II is a key resource for students looking to launch ventures based on their research.  

**Insights**:  
- The MIT ecosystem is highly collaborative, with strong ties between academia, industry, and venture capital.  
- Startups in this region often benefit from access to top-tier talent, funding opportunities, and incubators.  
- The area has a high concentration of venture capital firms and accelerators that support early-stage startups.  

**Practical Tips**:  
- **Hours**: Most MIT departments and entrepreneurial programs operate during regular business hours (9:00 AM – 5:00 PM), though some events may extend into the evening.  
- **Pricing**: Programs like MIT II and the Sloan Executive Education are often fee-based, with costs ranging from $10,000 to $25,000 depending on the program.  
- **Reservations/Registrations**: Most programs require prior registration or application. Check the official websites for deadlines and enrollment details.  

**Additional Resources**:  
- **Massachusetts Institute of Technology Entrepreneurship Center (https://entrepreneurship.mit.edu)**  
- **Cambridge Innovation Center (https://www.cic.com)**  
- **MIT Media Lab (https://media.mit.edu)**  

These recommendations provide a comprehensive overview of the startup ecosystem around MIT, with specific insights into resources, programs, and locations that support entrepreneurial activity.

--------------------------------------------------

🚀 Testing Travel Planning Agent:
==================================================
**Summary**:  
A perfect day in San Francisco for a tech entrepreneur visiting for the first time would include visiting key tech landmarks such as Salesforce Tower, Google's Mountain View campus (though it's in Mountain View), and the Silicon Valley Innovation District. The day would also incorporate high-quality coffee shops ideal for meetings and a memorable dinner experience.

---

**Top Recommendations**:  

1. **Salesforce Tower**  
   - **Location**: 300 Mission Street, San Francisco  
   - **Details**: One of the tallest buildings in the United States, Salesforce Tower offers stunning views of the city from its observation deck. It's located just a short walk from the Financial District and is home to Salesforce, a major tech company. The building has a modern, sleek design that reflects the innovation spirit of San Francisco.  
   - **Source**: `location_search` for Salesforce Tower details  

2. **Stumptown Coffee Roasters**  
   - **Location**: 1075 Mission Street, San Francisco  
   - **Details**: A popular coffee shop known for its high-quality beans and strong, rich coffee. It's a favorite among locals and visitors alike, making it an ideal spot for meetings or casual chats. The café has a vibrant, creative atmosphere that’s perfect for tech entrepreneurs.  
   - **Source**: `location_search` for Stumptown Coffee Roasters  

3. **The Rookery**  
   - **Location**: 1447 Mission Street, San Francisco  
   - **Details**: A cozy, modern café with a focus on coffee and baked goods. The Rookery is known for its friendly staff and excellent ambiance, making it a great choice for both meetings and relaxation. It's located near the Financial District and has easy access to public transportation.  
   - **Source**: `location_search` for The Rookery  

4. **Dinner at The Spotted Pig**  
   - **Location**: 1075 Mission Street, San Francisco  
   - **Details**: A popular restaurant known for its modern American cuisine and creative menu. It’s a favorite among tech professionals and has a great atmosphere with a view of the city. The Spotted Pig is located near several coffee shops and is within walking distance of many key tech locations.  
   - **Source**: `location_search` for The Spotted Pig  

---

**Insights**:  
- San Francisco's tech scene is centered around the Financial District and areas like Mission Street, which are filled with co-working spaces, cafes, and restaurants that cater to entrepreneurs.  
- The city has a strong culture of innovation, reflected in its architecture, businesses, and social environment.  
- The availability of high-quality coffee shops along Mission Street makes it an ideal location for meetings and networking.  

---

**Practical Tips**:  
- **Hours**: Most cafes like Stumptown Coffee Roasters are open from 7:00 AM to 10:00 PM, while restaurants like The Spotted Pig typically have dinner service from 5:00 PM to 9:00 PM.  
- **Pricing**: Coffee at Stumptown ranges from $3.50 to $6.00 per cup, while a main course at The Spotted Pig can range from $12 to $20.  
- **Reservations**: It’s recommended to make reservations for dinner at The Spotted Pig in advance, especially on weekends. Most coffee shops do not require reservations but can be busy during peak hours.  

**Todos Completed**:  
- Task 1: Use `location_search` to find top tech landmarks in San Francisco ✅  
- Task 2: Use `location_search` to find great coffee shops for meetings ✅  
- Task 3: Use `location_search` to find dinner recommendations ✅  
- Task 4: Synthesize findings into a structured response ✅
```

### Advanced Example

Run the multi-AI location intelligence system:
```bash
python 02-advanced-example.py
```

<img width="1815" height="2180" alt="mermaid-diagram-2025-09-09-092940" src="https://github.com/user-attachments/assets/be773651-7ddf-47fb-8361-103bdd2c790e" />

#### Example Response

```
python camino.py
🌍 Multi-AI Location Intelligence System
============================================================

🔍 Query 1: Plan a tech startup tour in San Francisco with optimal routing between locations
============================================================
📋 Response:
**Executive Summary**  
A tech startup tour in San Francisco can be optimized by leveraging the city's rich tech ecosystem, including Silicon Valley landmarks and key startup hubs. The route should balance proximity to major tech companies, innovation districts, and historical sites that reflect the region’s entrepreneurial spirit.

---

### **Location Intelligence**

Using **Camino AI**, we analyze the spatial relationships between key locations in San Francisco and surrounding areas:

- **San Francisco Financial District**: Central hub for many tech startups and financial institutions.
- **Mission District**: Known for its vibrant startup scene, co-working spaces, and cultural diversity.
- **South of Market (SoMa)**: Home to numerous tech companies, venture capital firms, and innovation incubators.
- **Googleplex (Mountain View, CA)**: A key location in the broader Silicon Valley area, though slightly outside San Francisco proper.
- **Palo Alto**: Adjacent to San Francisco via the Bay Bridge, with a strong startup culture.

**Optimal routing** would involve starting in San Francisco’s Financial District, moving through SoMa and the Mission District, then heading to Palo Alto for a visit to Googleplex or other tech landmarks. This route maximizes proximity to key tech companies while minimizing travel time between locations.

---

### **Practical Details**

- **Opening Hours**: Most tech startups and co-working spaces are open Monday-Friday from 9:00 AM to 6:00 PM.
- **Pricing**: Co-working spaces typically charge $30–$150 per month for a shared desk, with premium options available at higher rates.
- **Accessibility**: San Francisco has an extensive public transit system (Muni), bike lanes, and pedestrian-friendly areas. The Bay Bridge connects to Palo Alto efficiently.

---

### **Recommendations**

1. **Start in the Financial District** – Begin your tour at a major tech company or co-working space in the Financial District.
2. **Visit SoMa** – Explore innovation hubs like the Salesforce Tower or the Salesforce Innovation Center.
3. **Head to the Mission District** – Visit co-working spaces and startup incubators such as WeWork or The Foundry.
4. **Travel to Palo Alto** – Take a short train ride (about 20 minutes) to Googleplex or other tech landmarks in the area.
5. **End at a Tech Museum or Historical Site** – Conclude your tour with a visit to the San Francisco Museum of Modern Art or the de Young Museum, which provide historical context for the region’s tech evolution.

---

### **Sources**

- **Camino AI**: Used to analyze spatial relationships and optimize routing between key locations in San Francisco and Silicon Valley.
- **Web Search**: Used to verify opening hours, pricing, and accessibility details of co-working spaces and tech landmarks.

---

**Todos:**
- [Completed] Identified key tech locations in San Francisco using Camino AI.
- [Completed] Verified practical details (hours, pricing, accessibility) via web search.
- [Completed] Created optimized route based on spatial intelligence and real-world data.

------------------------------------------------------------

🔍 Query 2: Analyze walkability and amenities around potential office locations in downtown Austin
============================================================
📋 Response:
**Executive Summary**  
This analysis focuses on evaluating the walkability and amenities around potential office locations in downtown Austin. The goal is to identify areas that are highly accessible, have a variety of nearby services, and align with the principles of intuitive design and brand expression, similar to Apple's store strategy.

---

### **Location Intelligence**

Using **Camino AI**, we can analyze spatial relationships and walkability metrics for potential office locations in downtown Austin. Key factors include:

- **Walkability Score**: Measures how easy it is to walk to key destinations such as restaurants, cafes, public transit, and other business-related amenities.
- **Proximity to Amenities**: Distance to essential services like grocery stores, coffee shops, parks, and public transportation hubs.
- **Commercial Activity**: Density of businesses and foot traffic in the area.
- **Accessibility**: Availability of sidewalks, crosswalks, and bike lanes.

Based on this analysis, we can identify areas that are not only walkable but also rich in amenities, making them ideal for office spaces. These locations would align with the principle of "getting people to walk ten feet" rather than drive long distances.

---

### **Practical Details**

- **Walkability**: Downtown Austin has a high walkability score due to its compact layout and mix of residential, commercial, and recreational areas.
- **Amenities**:
  - **Restaurants & Cafes**: Numerous options in the downtown area, including popular spots like The Rodeo, Cava, and The Blue Note.
  - **Grocery Stores**: Nearby grocery stores such as Whole Foods, H-E-B, and Publix are within walking distance of many office locations.
  - **Public Transit**: Austin has a robust public transportation system, including the light rail (Aurora Line) and bus services that connect downtown to other parts of the city.
  - **Parks & Recreational Areas**: The Zilker Park and Lady Bird Lake are within walking distance of many office locations in downtown Austin.

---

### **Recommendations**

1. **Office Location A: 200 Congress Avenue, Downtown Austin**  
   - **Walkability Score**: High (9/10)  
   - **Proximity to Amenities**: Within a 5-minute walk to restaurants, cafes, and public transit.  
   - **Accessibility**: Well-connected with sidewalks and bike lanes.  
   - **Reasoning**: This location is ideal for an office due to its high walkability and proximity to essential amenities.

2. **Office Location B: 1001 Red River Street, Downtown Austin**  
   - **Walkability Score**: Medium (7/10)  
   - **Proximity to Amenities**: Within a 10-minute walk to restaurants, cafes, and public transit.  
   - **Accessibility**: Good access with sidewalks but less bike-friendly than Location A.  
   - **Reasoning**: This location is suitable for an office that prioritizes accessibility over extreme walkability.

3. **Office Location C: 500 Congress Avenue, Downtown Austin**  
   - **Walkability Score**: High (9/10)  
   - **Proximity to Amenities**: Within a 5-minute walk to restaurants, cafes, and public transit.  
   - **Accessibility**: Excellent access with sidewalks and bike lanes.  
   - **Reasoning**: This location is ideal for an office that values both walkability and accessibility.

---

### **Sources**

- **Camino AI**: Used to analyze spatial relationships, walkability scores, and proximity to amenities.
- **Web Search**: Used to verify the availability of restaurants, cafes, grocery stores, and public transit options in downtown Austin.

---

**Todos:**
- [Completed] Analyzed walkability and amenities using Camino AI.
- [Completed] Verified practical details with web search.
- [Completed] Synthesized insights into recommendations.

------------------------------------------------------------

🔍 Query 3: Find the best coffee shops for remote work in Paris with good transportation access
============================================================
📋 Response:
- **Task**: Use Gaia Node to find coffee shops in Paris with good transportation access.
- **Task**: Use Camino AI to analyze the spatial relationships and accessibility of these coffee shops.
- **Task**: Use Web Search to verify current reviews, pricing, and opening hours for the top coffee shops.

**Todos:**
1. Use Gaia Node to find coffee shops in Paris with good transportation access.
2. Use Camino AI to analyze the spatial relationships and accessibility of these coffee shops.
3. Use Web Search to verify current reviews, pricing, and opening hours for the top coffee shops.

------------------------------------------------------------

🚀 Advanced Multi-AI Analyses
============================================================

🏢 Comparative Office Location Analysis:
========================================
**Executive Summary:**
A comparative analysis between SoMa (South of Market) and the Mission District in San Francisco reveals distinct characteristics that make each area suitable for different types of tech startups. SoMa is a hub for innovation, with high accessibility, proximity to transit, and a concentration of tech firms and venture capital. The Mission District offers a more diverse cultural atmosphere, affordable housing, and a strong community feel, though it has lower density and less direct access to major transit lines.

**Location Intelligence:**
- **SoMa (South of Market):**
  - **Spatial Relationships:** SoMa is located in the heart of San Francisco’s financial district, adjacent to the Financial District and near the Embarcadero. It is bordered by the Mission Street, Jackson Street, and the Bay. The area is highly connected to other parts of the city via public transit, including the Muni system and BART.
  - **Accessibility:** SoMa has excellent accessibility with multiple bus routes, subway lines (e.g., the Market Street Line), and bike lanes. It is easily reachable from San Francisco International Airport (SFO) via public transportation or car.
  - **Amenities:** The area is rich in amenities such as restaurants, cafes, co-working spaces, and tech firms. It also has a high concentration of venture capital firms and angel investors.
  - **Overall Suitability:** SoMa is highly suitable for tech startups that require proximity to financial institutions, venture capital, and a fast-paced, innovative environment.

- **Mission District:**
  - **Spatial Relationships:** The Mission District is located in the southeastern part of San Francisco, adjacent to the Tenderloin and the East Bay. It is bordered by 16th Street, Mission Street, and the Bay. The area is more spread out compared to SoMa.
  - **Accessibility:** The Mission District has limited direct access to major transit lines like BART or the Muni system. However, it has a strong network of bus routes that connect it to other parts of the city.
  - **Amenities:** The Mission District offers a diverse cultural atmosphere with a wide range of restaurants, shops, and community events. It is also home to several co-working spaces and tech startups, though not as densely concentrated as SoMa.
  - **Overall Suitability:** The Mission District is suitable for tech startups that value a more laid-back, community-oriented environment and are willing to accept slightly longer commutes or less direct access to transit.

**Practical Details:**
- **SoMa:**
  - **Hours of Operation:** Most businesses in SoMa operate from 9 AM to 6 PM, with many co-working spaces open late into the evening.
  - **Pricing:** Office space in SoMa is more expensive compared to other parts of San Francisco due to its proximity to financial institutions and tech firms.
  - **Accessibility:** The area has a high density of parking options, though it can be limited during peak hours.

- **Mission District:**
  - **Hours of Operation:** Most businesses in the Mission District operate from 9 AM to 6 PM, with some co-working spaces open late into the evening.
  - **Pricing:** Office space in the Mission District is more affordable compared to SoMa, though it can vary depending on the specific location and size of the space.
  - **Accessibility:** The area has a strong network of bus routes but limited direct access to major transit lines like BART or the Muni system.

**Recommendations:**
- For tech startups that require proximity to financial institutions, venture capital, and a fast-paced, innovative environment, SoMa is the better choice.
- For tech startups that value a more laid-back, community-oriented environment and are willing to accept slightly longer commutes or less direct access to transit, the Mission District is a good alternative.

**Sources:**
- **Spatial Relationships and Accessibility:** Camino AI
- **Amenities and Overall Suitability:** Gaia Node and Web Search
- **Practical Details (Hours, Pricing, Accessibility):** Web Search

✈️ Specialized Travel Planning:
========================================
I'm delighted to help you plan a luxurious weekend in Napa Valley, focusing on wine tours and fine dining. Let's start by creating a detailed itinerary that balances relaxation, exploration, and indulgence.

### Day 1: Arrival and Wine Tour
**Morning:**
- **Arrival at Napa Valley:** We'll begin with a scenic drive to Napa Valley, where we can enjoy the beautiful vineyards and rolling hills.
- **Check-in at a Luxury Hotel:** We'll check into a high-end hotel in Napa, such as The Ritz-Carlton Napa Valley or Castello di Amorosa. These hotels offer exceptional amenities and views of the valley.

**Afternoon:**
- **Wine Tour:** We'll embark on a guided wine tour to some of the most prestigious wineries in Napa. We'll visit a few top-rated vineyards, such as:
  - **Domaine Carneros:** Known for its sparkling wines and stunning château.
  - **Stag's Leap Wine Cellars:** Famous for its 1973 Cabernet Sauvignon, which won the 1976 Judgement of Paris.
  - **Robert Mondavi Winery:** A historic winery with a rich history in Napa Valley.

**Evening:**
- **Dinner at a Fine Dining Restaurant:** We'll enjoy a gourmet dinner at a highly-rated restaurant in Napa, such as:
  - **The French Laundry (Napa):** A Michelin-starred restaurant offering an exquisite menu.
  - **Bouchon Bistro (Napa):** Known for its creative and flavorful dishes.

### Day 2: Exploring Napa Valley
**Morning:**
- **Breakfast at the Hotel:** We'll start our day with a luxurious breakfast at our hotel, featuring local produce and artisanal products.
- **Wine Tour:** We'll take another wine tour to explore more wineries in Napa. We might visit:
  - **Château Montelena:** A historic vineyard known for its Chardonnay.
  - **Cloudy Bay Winery:** A family-owned winery with a focus on sustainable practices.

**Afternoon:**
- **Relaxation and Leisure:** After our wine tour, we'll have some time to relax at the hotel or take a leisurely walk through the vineyards.
- **Optional Activity:** We might consider an optional activity such as a horseback ride through the valley or a visit to a local art gallery.

**Evening:**
- **Dinner at a Fine Dining Restaurant:** We'll enjoy another gourmet dinner at a highly-rated restaurant in Napa, such as:
  - **The Bistro at Castello di Amorosa:** A unique dining experience set in a medieval-style castle.
  - **Casa Monica:** A charming restaurant with a focus on local and seasonal ingredients.

### Additional Considerations
- **Transportation:** We'll use Camino for optimal routing to ensure we have the most efficient and comfortable travel between locations.
- **Accommodations:** We'll stay at luxury hotels that offer exceptional service, amenities, and views of Napa Valley.
- **Local Insights:** We'll incorporate local insights and cultural context to enhance our experience in Napa Valley.

I'm excited about planning this luxurious weekend in Napa Valley. Let's start by creating a detailed itinerary and ensuring all the necessary tasks are completed. 

### Todos:
1. Confirm hotel reservations for The Ritz-Carlton Napa Valley or Castello di Amorosa.
2. Book guided wine tours to Domaine Carneros, Stag's Leap Wine Cellars, and Robert Mondavi Winery.
3. Reserve dinner at The French Laundry (Napa) and Bouchon Bistro (Napa).
4. Confirm transportation using Camino for optimal routing between locations.
5. Research and incorporate local insights and cultural context for the itinerary.

Let me know if you'd like to make any changes or additions to this plan!
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Gaia Node Configuration
GAIANET_API_KEY=your_gaia_net_api_key
GAIANET_BASE_URL=http://localhost:8080/v1

# Tavily Web Search
TAVILY_API_KEY=your_tavily_api_key

# Camino AI (for advanced example)
CAMINO_API_KEY=your_camino_ai_api_key
```

### API Keys Required

1. **Gaia Node**: Local AI processing with Qwen3-4B-Q5_K_M
2. **Tavily**: Real-time web search and context
3. **Camino AI**: Advanced location intelligence (optional for basic example)

## 📋 Examples

### Basic Usage
```python
# Simple location query
query = "Coffee shops in Paris with good WiFi"
result = agent.invoke({"messages": [{"role": "user", "content": query}]})
```

### Advanced Usage
```python
# Enterprise location analysis
query = """
Analyze SoMa San Francisco for tech office suitability. 
Include walkability, amenities, and competitor analysis.
"""
result = multi_ai_agent.invoke({"messages": [{"role": "user", "content": query}]})
```

## 🏗️ Architecture

### Basic Agent (01-basic-example.py)
- Gaia Node with Qwen3-4B-Q5_K_M for local processing
- Tavily for web search and context
- Simple location tools implementation

### Advanced Agent (02-advanced-example.py)
- Multi-AI architecture with intelligent routing
- Gaia Node for basic location processing
- Camino AI for advanced spatial reasoning
- Tavily for real-time context
- Specialized sub-agents for different use cases

## 🎯 Use Cases

### Supported Applications
- **Local Business Discovery**
- **Travel Planning & Itineraries**
- **Real Estate Location Analysis**
- **Market Research & Expansion Planning**
- **Supply Chain & Logistics Optimization**
- **Urban Planning & Development**

### Industry Applications
- **Retail**: Site selection and market analysis
- **Real Estate**: Property valuation through location intelligence
- **Logistics**: Route optimization and facility placement
- **Tourism**: Personalized travel recommendations
- **Urban Planning**: Infrastructure and amenity planning

## ⚡ Performance Tips

1. **Query Optimization**: Use specific, well-structured queries
2. **Caching**: Implement caching for frequent location queries
3. **Error Handling**: Use robust fallback mechanisms
4. **Model Selection**: Choose appropriate AI system based on query complexity

## 🔒 Security Considerations

- Local AI processing enhances data privacy
- Encrypt sensitive location data
- Implement role-based access control
- Regularly audit API usage and permissions

## 🛠️ Customization

### Adding New Tools
```python
def custom_location_tool(query: str):
    """Example custom tool implementation"""
    # Your custom logic here
    return results

agent = create_deep_agent(
    tools=[custom_location_tool, existing_tools],
    instructions=custom_instructions
)
```

### Creating Specialized Sub-agents
```python
def create_custom_agent():
    return create_deep_agent(
        tools=[selected_tools],
        instructions=specialized_instructions,
        model=gaia_client
    )
```

## 📊 Monitoring & Logging

Implement monitoring for:
- API usage and rate limits
- Response times and performance
- Error rates and failure patterns
- Cost tracking for paid services

## 🔗 Resources

- [Gaia Nodes Documentation](https://docs.gaianet.ai)
- [Tavily API Docs](https://docs.tavily.com)
- [Camino AI Documentation](https://docs.caminoai.com)
- [DeepAgents GitHub](https://github.com/deepagents/deepagents)

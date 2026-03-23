import fs from 'fs';
import path from 'path';

const today = new Date().toISOString().split('T')[0];
const filePath = path.join('/Users/mgtvalavan/UPSC coaching antigravity/src/data/epaper', `epaper-${today}.json`);

const epaper = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

epaper.prelimsMocks = [
  {
    question: "With reference to the Strait of Hormuz, consider the following statements:\n1. It connects the Persian Gulf to the Gulf of Oman.\n2. It lies between Iran and Oman.\nWhich of the statements given above is/are correct?",
    options: ["A. 1 only", "B. 2 only", "C. Both 1 and 2", "D. Neither 1 nor 2"],
    answer: "C. Both 1 and 2",
    explanation: "The Strait of Hormuz is a strategically important strait or narrow strip of water that links the Persian Gulf with the Arabian Sea and the Gulf of Oman. It is bordered by Iran to the north and Oman (the Musandam Peninsula) to the south."
  },
  {
    question: "In the context of 'passive euthanasia' in India, which of the following statements is/are correct?\n1. Active euthanasia is completely illegal in India.\n2. The Supreme Court has upheld passive euthanasia under Article 21, subject to strict guidelines.\nSelect the correct answer using the code given below:",
    options: ["A. 1 only", "B. 2 only", "C. Both 1 and 2", "D. Neither 1 nor 2"],
    answer: "C. Both 1 and 2",
    explanation: "Active euthanasia involves the administration of a lethal substance to end a life and is illegal in India. Passive euthanasia involves withdrawing life support. The SC legalized passive euthanasia in 2018, ruling that the right to die with dignity is a fundamental right under Article 21."
  },
  {
    question: "Consider the following statements regarding the Jal Jeevan Mission:\n1. It aims to provide 55 litres of water per person per day to every rural household.\n2. The implementation heavily relies on decentralized, community-managed 'Paani Samitis'.\nWhich of the statements given above is/are correct?",
    options: ["A. 1 only", "B. 2 only", "C. Both 1 and 2", "D. Neither 1 nor 2"],
    answer: "C. Both 1 and 2",
    explanation: "The Jal Jeevan Mission (JJM) aims to provide Functional Household Tap Connections (FHTC) to every rural household with the norm of 55 LPCD. Gram Panchayats or their sub-committees, i.e., Village Water & Sanitation Committees (VWSC)/Paani Samitis, play a key role in its planning and implementation."
  },
  {
    question: "Which of the following bodies is responsible for auditing the Namami Gange programme?",
    options: ["A. National Green Tribunal (NGT)", "B. Comptroller and Auditor General (CAG)", "C. Central Pollution Control Board (CPCB)", "D. Finance Commission"],
    answer: "B. Comptroller and Auditor General (CAG)",
    explanation: "The Comptroller and Auditor General (CAG) is the supreme constitutional auditing body of India, responsible for auditing all receipts and expenditures of the Government of India, including specific flagship programmes like Namami Gange."
  },
  {
    question: "With reference to the 'Albedo effect', consider the following statements:\n1. It refers to the fraction of solar energy reflected by a surface.\n2. Snow and ice have a significantly lower albedo compared to open ocean water.\nWhich of the given statements is/are correct?",
    options: ["A. 1 only", "B. 2 only", "C. Both 1 and 2", "D. Neither 1 nor 2"],
    answer: "A. 1 only",
    explanation: "Albedo is the proportion of incoming solar radiation reflected by a surface. Snow and ice have a very HIGH albedo (reflecting most sunlight), whereas open ocean water has a very low albedo (absorbing most sunlight). As ice melts, the lower-albedo water absorbs more heat, accelerating warming."
  }
];

epaper.mainsMocks = [
  {
    question: "The escalating conflict in West Asia poses a multifaceted threat to India's macroeconomic stability. Discuss the vulnerabilities in India's energy supply chains and the diplomatic strategies required to mitigate them.",
    syllabusMatch: "GS2 (IR: Policies of developed and developing countries affecting India's interests) & GS3 (Economy: Energy Security)",
    approach: "Introduce the current geopolitical flashpoints in West Asia affecting energy transit chokepoints. Detail the economic impact on India, particularly regarding crude oil and LNG supply dependencies. Conclude with India's multi-alignment strategy and the need for diversifying energy sources and accelerating the renewable energy transition."
  },
  {
    question: "Critically evaluate the legal and ethical framework surrounding 'passive euthanasia' in India following recent judicial interpretations. What are the administrative challenges in executing an advance medical directive (living will)?",
    syllabusMatch: "GS2 (Polity: Fundamental Rights, Judiciary)",
    approach: "Define passive euthanasia and trace its legal evolution from Aruna Shanbaug to the Common Cause judgment. Discuss the ethical dilemma between the right to life and the right to die with dignity. Highlight the complex medical board procedures and ongoing efforts by the Supreme Court to streamline these mechanisms."
  },
  {
    question: "Despite massive financial outlays under the Namami Gange programme, the upper reaches of the Ganga continue to suffer from severe coliform bacterial pollution. Analyze the governance and infrastructural bottlenecks impeding river rejuvenation in Himalayan states.",
    syllabusMatch: "GS3 (Environment: Environmental Pollution & Degradation) & GS2 (Governance)",
    approach: "Reference recent CAG findings regarding increased coliform levels. Discuss the challenges of unregulated urbanization and tourism in fragile Himalayan zones. Evaluate the shortcomings of current Sewage Treatment Plants (STPs) and suggest decentralized, nature-based bio-remediation models and better empowerment of Urban Local Bodies."
  },
  {
    question: "In the era of rapid digital transformation, generative AI and deepfakes present an asymmetric threat to democratic processes and internal security. Discuss the adequacy of India's current regulatory framework, such as the IT Rules 2021, and recommend necessary policy interventions.",
    syllabusMatch: "GS3 (Security: Challenges to Internal Security through Communication Networks; Science & Tech: IT/AI)",
    approach: "Introduce the proliferation of hyper-realistic synthetic media (deepfakes) and its impact on electoral integrity and public order. Critique the retroactive takedown approach of current regulations. Propose anticipatory measures like mandatory watermarking, the establishment of content provenance standards, and dedicated legislation under the upcoming Digital India Act."
  },
  {
    question: "The phenomenon of 'Greenlandification' of the Antarctic ice shelves highlights an approaching global climate tipping point. Examine the mechanism of this accelerated melting and its implications for India's coastal vulnerability.",
    syllabusMatch: "GS3 (Environment: Climate Change & Disaster Management)",
    approach: "Define 'Greenlandification' and explain mechanisms like surface meltwater pooling, altered albedo, and hydrofracturing. Detail the existential threat posed by rising global mean sea levels to India's extensive 7,500-km coastline and major urban hubs like Mumbai and Chennai. Conclude with the necessity for robust coastal adaptation policies and global emission reduction compliance."
  }
];

fs.writeFileSync(filePath, JSON.stringify(epaper, null, 2));
console.log("Mocks added to epaper");

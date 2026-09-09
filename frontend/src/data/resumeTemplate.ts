// A clean, single-column LaTeX resume that compiles in Overleaf out of the box
// (only standard packages — no moderncv/exotic classes). Used to seed a new resume.
export const DEFAULT_LATEX_RESUME = String.raw`\documentclass[a4paper,11pt]{article}
\usepackage[margin=1.5cm]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage[hidelinks]{hyperref}
\setlength{\parindent}{0pt}
\titleformat{\section}{\large\bfseries}{}{0pt}{}[\titlerule]
\titlespacing{\section}{0pt}{10pt}{6pt}

\begin{document}

\begin{center}
  {\LARGE \textbf{Your Name}}\\[2pt]
  City, Country \textbullet\ email@example.com \textbullet\ +000 0000000\\
  github.com/you \textbullet\ linkedin.com/in/you
\end{center}

\section{Summary}
One or two sentences on who you are and the role you're targeting.

\section{Experience}
\textbf{Job Title} \hfill \textit{Company} \\
\textit{Location} \hfill \textit{Mon YYYY -- Present}
\begin{itemize}[leftmargin=*,nosep]
  \item Achievement with quantified impact (what you did, how, the result).
  \item Another bullet — start with a strong verb, include a metric.
\end{itemize}

\section{Projects}
\textbf{Project Name} \hfill \textit{Tech used}
\begin{itemize}[leftmargin=*,nosep]
  \item What it does and the impact / scale.
\end{itemize}

\section{Skills}
Languages: Python, JavaScript \\
Frameworks: Django, React \\
Tools: Docker, PostgreSQL, Git

\section{Education}
\textbf{Degree} \hfill \textit{Institution} \\
\textit{Field} \hfill \textit{YYYY -- YYYY}

\end{document}
`;

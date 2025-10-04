from django.core.management.base import BaseCommand
from datetime import timedelta
from learning_paths.models import LearningTopic, LearningSubtopic, DifficultyLevelChoices


class Command(BaseCommand):
    help = 'Create sample learning topics and subtopics'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample learning topics...')
        
        # JavaScript Fundamentals
        js_topic = LearningTopic.objects.create(
            name="JavaScript Fundamentals",
            description="Learn the core concepts of JavaScript programming including variables, functions, objects, and control flow.",
            difficulty_level=DifficultyLevelChoices.BEGINNER,
            estimated_duration=timedelta(hours=20)
        )
        
        js_subtopics = [
            {
                'name': 'Variables and Data Types',
                'description': 'Understanding var, let, const and different data types in JavaScript',
                'order': 1,
                'learning_objectives': [
                    'Understand the difference between var, let, and const',
                    'Know primitive data types: string, number, boolean, null, undefined',
                    'Learn about type coercion and typeof operator'
                ],
                'estimated_duration': timedelta(hours=2)
            },
            {
                'name': 'Functions and Scope',
                'description': 'Function declarations, expressions, arrow functions, and scope concepts',
                'order': 2,
                'learning_objectives': [
                    'Create functions using different syntaxes',
                    'Understand function scope and closures',
                    'Learn about hoisting and the this keyword'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Objects and Arrays',
                'description': 'Working with objects, arrays, and their methods',
                'order': 3,
                'learning_objectives': [
                    'Create and manipulate objects',
                    'Use array methods like map, filter, reduce',
                    'Understand object destructuring and spread operator'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Control Flow and Loops',
                'description': 'Conditional statements, loops, and error handling',
                'order': 4,
                'learning_objectives': [
                    'Use if/else statements and switch cases',
                    'Implement for, while, and for...of loops',
                    'Handle errors with try/catch blocks'
                ],
                'estimated_duration': timedelta(hours=2)
            },
            {
                'name': 'DOM Manipulation',
                'description': 'Interacting with HTML elements using JavaScript',
                'order': 5,
                'learning_objectives': [
                    'Select and modify DOM elements',
                    'Handle events and user interactions',
                    'Create dynamic web content'
                ],
                'estimated_duration': timedelta(hours=4)
            }
        ]
        
        for subtopic_data in js_subtopics:
            LearningSubtopic.objects.create(
                topic=js_topic,
                **subtopic_data
            )
        
        # Python Basics
        python_topic = LearningTopic.objects.create(
            name="Python Programming Basics",
            description="Master the fundamentals of Python programming including syntax, data structures, and object-oriented programming.",
            difficulty_level=DifficultyLevelChoices.BEGINNER,
            estimated_duration=timedelta(hours=25)
        )
        
        python_subtopics = [
            {
                'name': 'Python Syntax and Variables',
                'description': 'Basic Python syntax, variables, and data types',
                'order': 1,
                'learning_objectives': [
                    'Understand Python syntax and indentation',
                    'Work with different data types',
                    'Use variables and naming conventions'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Data Structures',
                'description': 'Lists, tuples, dictionaries, and sets in Python',
                'order': 2,
                'learning_objectives': [
                    'Create and manipulate lists and tuples',
                    'Work with dictionaries and sets',
                    'Understand when to use each data structure'
                ],
                'estimated_duration': timedelta(hours=4)
            },
            {
                'name': 'Functions and Modules',
                'description': 'Creating functions, parameters, and importing modules',
                'order': 3,
                'learning_objectives': [
                    'Define and call functions',
                    'Use parameters and return values',
                    'Import and create modules'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Control Flow',
                'description': 'Conditional statements and loops in Python',
                'order': 4,
                'learning_objectives': [
                    'Use if/elif/else statements',
                    'Implement for and while loops',
                    'Understand list comprehensions'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Object-Oriented Programming',
                'description': 'Classes, objects, inheritance, and encapsulation',
                'order': 5,
                'learning_objectives': [
                    'Create classes and objects',
                    'Implement inheritance and polymorphism',
                    'Understand encapsulation and abstraction'
                ],
                'estimated_duration': timedelta(hours=5)
            },
            {
                'name': 'File Handling and Exceptions',
                'description': 'Working with files and handling errors',
                'order': 6,
                'learning_objectives': [
                    'Read from and write to files',
                    'Handle exceptions with try/except',
                    'Use context managers'
                ],
                'estimated_duration': timedelta(hours=3)
            }
        ]
        
        for subtopic_data in python_subtopics:
            LearningSubtopic.objects.create(
                topic=python_topic,
                **subtopic_data
            )
        
        # React Fundamentals (Intermediate)
        react_topic = LearningTopic.objects.create(
            name="React Fundamentals",
            description="Learn modern React development including components, hooks, state management, and routing.",
            difficulty_level=DifficultyLevelChoices.INTERMEDIATE,
            estimated_duration=timedelta(hours=30)
        )
        
        # Set JavaScript as prerequisite for React
        react_topic.prerequisites.add(js_topic)
        
        react_subtopics = [
            {
                'name': 'Components and JSX',
                'description': 'Understanding React components and JSX syntax',
                'order': 1,
                'learning_objectives': [
                    'Create functional and class components',
                    'Understand JSX syntax and rules',
                    'Pass and use props effectively'
                ],
                'estimated_duration': timedelta(hours=4)
            },
            {
                'name': 'State and Event Handling',
                'description': 'Managing component state and handling user events',
                'order': 2,
                'learning_objectives': [
                    'Use useState hook for state management',
                    'Handle form inputs and user events',
                    'Understand controlled vs uncontrolled components'
                ],
                'estimated_duration': timedelta(hours=4)
            },
            {
                'name': 'React Hooks',
                'description': 'useEffect, useContext, and other essential hooks',
                'order': 3,
                'learning_objectives': [
                    'Use useEffect for side effects',
                    'Implement useContext for state sharing',
                    'Create custom hooks'
                ],
                'estimated_duration': timedelta(hours=5)
            },
            {
                'name': 'Component Lifecycle',
                'description': 'Understanding component mounting, updating, and unmounting',
                'order': 4,
                'learning_objectives': [
                    'Understand component lifecycle phases',
                    'Use useEffect for lifecycle management',
                    'Optimize component performance'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Routing and Navigation',
                'description': 'Client-side routing with React Router',
                'order': 5,
                'learning_objectives': [
                    'Set up React Router',
                    'Create nested routes and navigation',
                    'Handle route parameters and query strings'
                ],
                'estimated_duration': timedelta(hours=4)
            }
        ]
        
        for subtopic_data in react_subtopics:
            LearningSubtopic.objects.create(
                topic=react_topic,
                **subtopic_data
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {LearningTopic.objects.count()} topics '
                f'with {LearningSubtopic.objects.count()} subtopics'
            )
        )

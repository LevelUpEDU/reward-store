// src/app/instructor/CourseCard/CourseCard.tsx

import React from 'react'

type CourseCardProps = {
    id: number
    title: string
    courseCode?: string
    description?: string | null
    onClick?: (courseId: number) => void
}

const CourseCard = ({
    id,
    title,
    courseCode,
    description,
    onClick,
}: CourseCardProps) => {
    const handleClick = () => {
        onClick?.(id)
    }

    return (
        <div
            className="course-card clickable"
            onClick={handleClick}
            style={{border: '2px solid transparent'}}>
            <div className="course-image">
                <span className="course-icon">📖</span>
            </div>
            <div className="course-info">
                <h3 className="course-title">{title}</h3>
                {courseCode && (
                    <p className="course-code">Code: {courseCode}</p>
                )}
                {description && (
                    <p className="course-description">{description}</p>
                )}
            </div>
        </div>
    )
}

export default CourseCard

// import React from 'react';
// type CourseCardProps = { title: string; students: number; completion: number; image: string };
// const CourseCard = ({ title, students, completion, image }: CourseCardProps) => (
//   <div className="course-card">
//     <div className="course-image" style={{ backgroundColor: image }}>
//       <span className="course-icon">📖</span>
//     </div>
//     <div className="course-info">
//       <h3 className="course-title">{title}</h3>
//       <div className="course-meta">
//         <span>👥 {students} students</span>
//         <span>✓ {completion}% completion</span>
//       </div>
//     </div>
//   </div>
// );
// export default CourseCard;

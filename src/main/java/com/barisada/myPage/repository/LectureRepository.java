package com.barisada.myPage.repository;

import com.barisada.myPage.model.Lecture;
import org.springframework.data.repository.CrudRepository;

public interface LectureRepository extends CrudRepository<Lecture, Long> {
}

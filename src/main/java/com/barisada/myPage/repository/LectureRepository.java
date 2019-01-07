package com.barisada.myPage.repository;

import com.barisada.myPage.model.Lecture;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface LectureRepository extends PagingAndSortingRepository<Lecture, Long> {
}

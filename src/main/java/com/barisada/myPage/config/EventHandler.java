package com.barisada.myPage.config;

import com.barisada.myPage.model.Lecture;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static com.barisada.myPage.config.WebSocketConfiguration.MESSAGE_PREFIX;

@Component
@RepositoryEventHandler(Lecture.class)
public class EventHandler {

    private final SimpMessagingTemplate websocket;
    private final EntityLinks entityLinks;

    @Autowired
    public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks){
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }

    @HandleAfterCreate
    public void newLecture(Lecture lecture) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + "/newLecture", getPath(lecture));
    }

    @HandleAfterDelete
    public void deleteLecture(Lecture lecture) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + "/deleteLecture", getPath(lecture));
    }

    @HandleAfterSave
    public void updateLecture(Lecture lecture) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + "/updateLecture", getPath(lecture));
    }

    /**
     * Take an {@link Lecture} and get the URI using Spring Data REST's {@link EntityLinks}.
     *
     * @param lecture
     */
    private String getPath(Lecture lecture) {
        return this.entityLinks.linkForSingleResource(lecture.getClass(),lecture.getId()).toUri().getPath();
    }
}

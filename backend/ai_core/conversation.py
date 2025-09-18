from ninja import Router

router = Router()


@router.get("/conversation", response=list[Conversation])
def list_conversations(request: Request):
    return Conversation.objects.all()

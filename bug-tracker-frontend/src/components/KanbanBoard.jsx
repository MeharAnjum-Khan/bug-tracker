import React from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Bug, Clock, CheckCircle2, Circle } from 'lucide-react';

const KanbanBoard = ({ tickets, onStatusChange, getPriorityColor, allTickets, onTicketClick, canEdit }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = [
        { id: 'To Do', title: 'To Do', icon: <Circle size={16} className="text-text-muted" /> },
        { id: 'In Progress', title: 'In Progress', icon: <Clock size={16} className="text-primary" /> },
        { id: 'Done', title: 'Done', icon: <CheckCircle2 size={16} className="text-green-600" /> },
    ];

    const [activeId, setActiveId] = React.useState(null);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeTicket = tickets.find(t => t._id === active.id);
            const overId = over.id;

            // Check if dropped over a column id
            if (columns.map(c => c.id).includes(overId)) {
                if (activeTicket.status !== overId) {
                    onStatusChange(active.id, overId);
                }
            } else {
                // Dropped over another ticket
                const overTicket = tickets.find(t => t._id === overId);
                if (overTicket && activeTicket.status !== overTicket.status) {
                    onStatusChange(active.id, overTicket.status);
                }
            }
        }
        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        icon={column.icon}
                        tickets={tickets.filter(t => t.status === column.id)}
                        getPriorityColor={getPriorityColor}
                        allTickets={allTickets}
                        onTicketClick={onTicketClick}
                        canEdit={canEdit}
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.5',
                        },
                    },
                }),
            }}>
                {activeId ? (
                    <TicketCard
                        ticket={tickets.find(t => t._id === activeId)}
                        getPriorityColor={getPriorityColor}
                        isOverlay
                        isDragging={true}
                        allTickets={allTickets}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

const KanbanColumn = ({ id, title, icon, tickets, getPriorityColor, allTickets, onTicketClick, canEdit }) => {
    const { setNodeRef } = useSortable({ id });

    return (
        <div className="flex flex-col h-full bg-background/50 rounded-sm border border-border/50">
            <div className="p-4 flex items-center justify-between border-b border-border bg-surface/50">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-bold text-sm text-text uppercase tracking-wider">{title}</h3>
                    <span className="bg-background px-2 py-0.5 rounded-full text-[10px] font-bold text-text-muted border border-border">
                        {tickets.length}
                    </span>
                </div>
            </div>
            <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-3 min-h-125">
                <SortableContext items={tickets.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tickets.map((ticket) => (
                        <SortableTicketCard
                            key={ticket._id}
                            ticket={ticket}
                            getPriorityColor={getPriorityColor}
                            allTickets={allTickets}
                            onTicketClick={onTicketClick}
                            canEdit={canEdit}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

const SortableTicketCard = ({ ticket, getPriorityColor, allTickets, onTicketClick, canEdit }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ticket._id, disabled: !canEdit });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div {...listeners} onClick={() => onTicketClick(ticket)}>
                <TicketCard
                    ticket={ticket}
                    getPriorityColor={getPriorityColor}
                    allTickets={allTickets}
                    isDragging={isDragging}
                />
            </div>
        </div>
    );
};

const TicketCard = ({ ticket, getPriorityColor, isOverlay, allTickets, isDragging }) => {
    if (!ticket) return null;

    const originalIndex = allTickets.indexOf(ticket);

    return (
        <div className={`bg-surface p-4 rounded-sm border border-border shadow-sm hover:border-primary/50 transition-colors group ${isDragging ? 'cursor-grabbing' : 'cursor-default active:cursor-grabbing'} ${isOverlay ? 'shadow-xl ring-2 ring-primary/20 rotate-2' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                    BT-{originalIndex + 1}
                </span>
                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                </div>
            </div>
            <h4 className="text-sm font-medium text-text mb-4 group-hover:text-primary transition-colors line-clamp-2">
                {ticket.title}
            </h4>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                    <div className="bg-red-500 p-0.5 rounded text-white">
                        <Bug size={10} />
                    </div>
                    <span className="text-[10px] font-medium text-text-muted">Issue</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-muted">
                        {ticket.assignee?.name || 'Unassigned'}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                        {ticket.assignee?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KanbanBoard;
